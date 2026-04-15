import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CountryPoint {
  country: string
  code: string
  gdp_per_capita: number
  population: number  // millions
  medal_count: number
  predicted: number
  ratio: number       // actual / expected — >1 means over-performing
  zscore: number
}

interface YearData {
  countries: CountryPoint[]
  curve: [number, number][]  // [[gdp_per_capita, predicted_medals], ...] at median population
}

interface SeasonData {
  years: number[]
  byYear: Record<string, YearData>
}

interface GapminderData {
  meta: { gdpMin: number; gdpMax: number; ratioMax: number }
  Summer: SeasonData
  Winter: SeasonData
}

type Season = 'Summer' | 'Winter'

// ─── IOC → ISO2 flag lookup (shared with RacingBarChart) ─────────────────────

const IOC_TO_ISO2: Record<string, string> = {
  AFG: 'af', ALB: 'al', ARE: 'ae', ARG: 'ar', ARM: 'am', AUS: 'au', AUT: 'at',
  AZE: 'az', BDI: 'bi', BEL: 'be', BGR: 'bg', BHS: 'bs', BLR: 'by', BMU: 'bm',
  BRA: 'br', CAN: 'ca', CHE: 'ch', CHL: 'cl', CHN: 'cn', CIV: 'ci', CMR: 'cm',
  COL: 'co', CRI: 'cr', CUB: 'cu', CYP: 'cy', CZE: 'cz', DEU: 'de', DNK: 'dk',
  DOM: 'do', DZA: 'dz', ECU: 'ec', EGY: 'eg', ERI: 'er', ESP: 'es', EST: 'ee',
  ETH: 'et', FIN: 'fi', FJI: 'fj', FRA: 'fr', GBR: 'gb', GEO: 'ge', GHA: 'gh',
  GRC: 'gr', GRD: 'gd', GTM: 'gt', HKG: 'hk', HRV: 'hr', HUN: 'hu', IDN: 'id',
  IND: 'in', IRL: 'ie', IRN: 'ir', IRQ: 'iq', ISL: 'is', ISR: 'il', ITA: 'it',
  JAM: 'jm', JPN: 'jp', KAZ: 'kz', KEN: 'ke', KGZ: 'kg', KOR: 'kr', KWT: 'kw',
  LTU: 'lt', LUX: 'lu', LVA: 'lv', MAR: 'ma', MDA: 'md', MEX: 'mx', MKD: 'mk',
  MNG: 'mn', MOZ: 'mz', NGA: 'ng', NLD: 'nl', NOR: 'no', NZL: 'nz', PAK: 'pk',
  PAN: 'pa', PER: 'pe', POL: 'pl', PRT: 'pt', PRY: 'py', QAT: 'qa', ROU: 'ro',
  RUS: 'ru', SAU: 'sa', SDN: 'sd', SEN: 'sn', SGP: 'sg', SRB: 'rs', SVK: 'sk',
  SVN: 'si', SWE: 'se', SYR: 'sy', THA: 'th', TJK: 'tj', TTO: 'tt', TUN: 'tn',
  TUR: 'tr', TZA: 'tz', UGA: 'ug', UKR: 'ua', URY: 'uy', USA: 'us', UZB: 'uz',
  VEN: 've', VNM: 'vn', ZAF: 'za', ZMB: 'zm', ZWE: 'zw',
}

function flagEmoji(code: string): string {
  const iso2 = IOC_TO_ISO2[code]
  if (!iso2) return '🏳'
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

// ─── Scale helpers ────────────────────────────────────────────────────────────

function logScale(value: number, domainMin: number, domainMax: number, rangeMin: number, rangeMax: number): number {
  const logMin = Math.log10(domainMin)
  const logMax = Math.log10(domainMax)
  const logVal = Math.log10(Math.max(value, domainMin))
  return rangeMin + ((logVal - logMin) / (logMax - logMin)) * (rangeMax - rangeMin)
}

function linearScale(value: number, domainMin: number, domainMax: number, rangeMin: number, rangeMax: number): number {
  return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin)
}

// ─── Color ────────────────────────────────────────────────────────────────────

function zscoreColor(z: number): string {
  if (z >= 2.5) return '#f59e0b'
  if (z >= 1.5) return '#fbbf24'
  if (z >= 0.5) return '#fde68a'
  if (z >= -0.5) return '#94a3b8'
  if (z >= -1.5) return '#93c5fd'
  return '#3b82f6'
}

function zscoreLabel(z: number): string {
  const abs = Math.abs(z).toFixed(1)
  return z >= 0 ? `+${abs}σ` : `−${abs}σ`
}

// ─── SVG Scatter Plot ─────────────────────────────────────────────────────────

const MARGIN = { top: 24, right: 24, bottom: 56, left: 64 }
const PLOT_W = 680
const PLOT_H = 420
const SVG_W = PLOT_W + MARGIN.left + MARGIN.right
const SVG_H = PLOT_H + MARGIN.top + MARGIN.bottom

const GDP_TICKS   = [100, 300, 1000, 3000, 10000, 30000, 100000]
const RATIO_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function bubbleRadius(medals: number): number {
  return Math.max(4, Math.sqrt(medals) * 2.4)
}

interface TooltipState {
  x: number
  y: number
  point: CountryPoint
}

interface ScatterPlotProps {
  yearData: YearData
  gdpMin: number
  gdpMax: number
  ratioMax: number
  pinnedCode: string | null
  allYearData: YearData[]
  currentYearIndex: number
  onPin: (code: string | null) => void
}

function ScatterPlot({ yearData, gdpMin, gdpMax, ratioMax, pinnedCode, allYearData, currentYearIndex, onPin }: ScatterPlotProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const xPos = useCallback(
    (gdp: number) => logScale(gdp, gdpMin, gdpMax, 0, PLOT_W),
    [gdpMin, gdpMax]
  )
  // Y axis: actual / expected ratio (1 = exactly as expected, >1 = over-performing)
  const yPos = useCallback(
    (ratio: number) => linearScale(Math.min(ratio, ratioMax), 0, ratioMax, PLOT_H, 0),
    [ratioMax]
  )

  const baselineY = yPos(1)  // flat "expected" line at ratio = 1

  // Trajectory for pinned country — shows ratio over time as GDP changed
  const trajectoryPoints = pinnedCode
    ? allYearData
        .slice(0, currentYearIndex + 1)
        .flatMap(yd => {
          const c = yd.countries.find(c => c.code === pinnedCode)
          return c ? [{ x: xPos(c.gdp_per_capita), y: yPos(c.ratio) }] : []
        })
    : []

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, point: CountryPoint) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      setTooltip({
        x: e.clientX - rect.left - MARGIN.left,
        y: e.clientY - rect.top - MARGIN.top,
        point,
      })
    },
    []
  )

  // Label top 6 over-performers by ratio
  const labelled = new Set(
    [...yearData.countries].sort((a, b) => b.ratio - a.ratio).slice(0, 6).map(c => c.code)
  )

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        ref={svgRef}
        width={SVG_W}
        height={SVG_H}
        style={{ overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* Subtle shading: above baseline = gold tint, below = blue tint */}
          <rect x={0} y={0} width={PLOT_W} height={baselineY} fill="#f59e0b" fillOpacity={0.04} />
          <rect x={0} y={baselineY} width={PLOT_W} height={PLOT_H - baselineY} fill="#3b82f6" fillOpacity={0.04} />

          {/* GDP vertical grid lines */}
          {GDP_TICKS.map((v: number) => (
            <line key={v}
              x1={xPos(v)} x2={xPos(v)} y1={0} y2={PLOT_H}
              stroke="#334155" strokeWidth={1} strokeDasharray="3,4" />
          ))}

          {/* Ratio horizontal grid lines */}
          {RATIO_TICKS.map((v: number) => {
            const y = yPos(v)
            if (y < 0 || y > PLOT_H) return null
            return (
              <line key={v}
                x1={0} x2={PLOT_W} y1={y} y2={y}
                stroke={v === 1 ? '#475569' : '#1e293b'}
                strokeWidth={v === 1 ? 1.5 : 1}
                strokeDasharray={v === 1 ? 'none' : '3,4'} />
            )
          })}

          {/* Flat "expected" baseline at ratio = 1 */}
          <text x={PLOT_W - 4} y={baselineY - 6} fill="#64748b" fontSize={10} textAnchor="end">
            1× expected
          </text>

          {/* Trajectory for pinned country */}
          {trajectoryPoints.length > 1 && (
            <polyline
              points={trajectoryPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="#f59e0b" strokeWidth={1.5}
              strokeOpacity={0.55} strokeDasharray="4,3" />
          )}

          {/* Bubbles — Y = ratio, size = actual medals, color = zscore */}
          {yearData.countries.map(c => {
            const cx = xPos(c.gdp_per_capita)
            const cy = yPos(c.ratio)
            const r  = bubbleRadius(c.medal_count)
            const isPinned = c.code === pinnedCode
            return (
              <circle
                key={c.code}
                cx={cx} cy={cy}
                r={isPinned ? r + 3 : r}
                fill={zscoreColor(c.zscore)}
                stroke={isPinned ? '#fff' : 'rgba(0,0,0,0.25)'}
                strokeWidth={isPinned ? 2 : 0.8}
                style={{ transition: 'cx 0.6s ease, cy 0.6s ease', cursor: 'pointer' }}
                opacity={pinnedCode && !isPinned ? 0.45 : 0.88}
                onMouseMove={e => handleMouseMove(e, c)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onPin(isPinned ? null : c.code)}
              />
            )
          })}

          {/* Labels for top over-performers */}
          {yearData.countries
            .filter(c => labelled.has(c.code))
            .map(c => {
              const cx = xPos(c.gdp_per_capita)
              const cy = yPos(c.ratio)
              const r  = bubbleRadius(c.medal_count)
              const shortName = c.country.length > 14 ? c.country.split(' ')[0] : c.country
              return (
                <text key={`lbl-${c.code}`}
                  x={cx + r + 3} y={cy + 4}
                  fill="#cbd5e1" fontSize={9.5}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {shortName}
                </text>
              )
            })}

          {/* X Axis */}
          <line x1={0} x2={PLOT_W} y1={PLOT_H} y2={PLOT_H} stroke="#475569" strokeWidth={1} />
          {GDP_TICKS.map((v: number) => {
            const x = xPos(v)
            if (x < 0 || x > PLOT_W) return null
            return (
              <g key={v} transform={`translate(${x},${PLOT_H})`}>
                <line y2={5} stroke="#475569" />
                <text y={18} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                  {v >= 1000 ? `$${v / 1000}k` : `$${v}`}
                </text>
              </g>
            )
          })}
          <text x={PLOT_W / 2} y={PLOT_H + 44} textAnchor="middle" fill="#94a3b8" fontSize={11}>
            GDP per capita (log scale)
          </text>

          {/* Y Axis */}
          <line x1={0} x2={0} y1={0} y2={PLOT_H} stroke="#475569" strokeWidth={1} />
          {RATIO_TICKS.map((v: number) => {
            const y = yPos(v)
            if (y < 0 || y > PLOT_H) return null
            return (
              <g key={v} transform={`translate(0,${y})`}>
                <line x2={-5} stroke="#475569" />
                <text x={-9} dy="0.35em" textAnchor="end"
                  fill={v === 1 ? '#e2e8f0' : '#64748b'} fontWeight={v === 1 ? 600 : 400} fontSize={10}>
                  {v}×
                </text>
              </g>
            )
          })}
          <text
            x={-PLOT_H / 2} y={-50}
            textAnchor="middle" fill="#94a3b8" fontSize={11}
            transform="rotate(-90)"
          >
            Actual / expected medals
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + MARGIN.left + 12,
            top: tooltip.y + MARGIN.top - 10,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 170,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13, marginBottom: 4 }}>
            {flagEmoji(tooltip.point.code)} {tooltip.point.country}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.7 }}>
            <div>GDP/capita: <span style={{ color: '#e2e8f0' }}>${tooltip.point.gdp_per_capita.toLocaleString()}</span></div>
            <div>Population: <span style={{ color: '#e2e8f0' }}>{tooltip.point.population.toFixed(1)}M</span></div>
            <div>Actual medals: <span style={{ color: '#e2e8f0' }}>{tooltip.point.medal_count}</span></div>
            <div>Expected medals: <span style={{ color: '#e2e8f0' }}>{tooltip.point.predicted}</span></div>
            <div style={{ marginTop: 4, fontWeight: 600, color: zscoreColor(tooltip.point.zscore) }}>
              {zscoreLabel(tooltip.point.zscore)} {tooltip.point.zscore >= 0 ? 'above' : 'below'} expected
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

function Leaderboard({ countries }: { countries: CountryPoint[] }) {
  const top5 = countries.slice(0, 5)
  const bottom5 = [...countries].sort((a, b) => a.zscore - b.zscore).slice(0, 5)

  const Row = ({ c }: { c: CountryPoint }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0',
      borderBottom: '1px solid #1e293b',
    }}>
      <span style={{ fontSize: 16 }}>{flagEmoji(c.code)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.country}
        </div>
        <div style={{ fontSize: 10, color: '#64748b' }}>
          {c.medal_count} medals · {c.predicted} expected
        </div>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: zscoreColor(c.zscore),
        flexShrink: 0,
      }}>
        {c.ratio.toFixed(1)}×
      </div>
    </div>
  )

  return (
    <div style={{ width: 220 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#f59e0b',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
        }}>
          Over-performers
        </div>
        {top5.map(c => <Row key={c.code} c={c}  />)}
      </div>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#3b82f6',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
          marginTop: 16,
        }}>
          Under-performers
        </div>
        {bottom5.map(c => <Row key={c.code} c={c}  />)}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GapminderScatter() {
  const [data, setData] = useState<GapminderData | null>(null)
  const [season, setSeason] = useState<Season>('Summer')
  const [yearIndex, setYearIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [pinnedCode, setPinnedCode] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/gapminder_scatter.json')
      .then(r => r.json())
      .then((d: GapminderData) => {
        setData(d)
        setYearIndex(0)
      })
      .catch(err => console.error('Failed to load gapminder data:', err))
  }, [])

  const seasonData = data?.[season]
  const years = seasonData?.years ?? []
  const currentYear = years[yearIndex]
  const currentYearData = currentYear ? seasonData?.byYear[String(currentYear)] : null
  const allYearData = years.map(y => seasonData!.byYear[String(y)])

  // Animation
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setYearIndex(prev => {
        if (prev >= years.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, years.length])

  const handleSeasonChange = (s: Season) => {
    setSeason(s)
    setYearIndex(0)
    setIsPlaying(false)
    setPinnedCode(null)
  }

  const handlePlay = () => {
    if (yearIndex >= years.length - 1) setYearIndex(0)
    setIsPlaying(p => !p)
  }

  if (!data || !currentYearData) {
    return (
      <div style={{ color: '#64748b', padding: '2rem', textAlign: 'center' }}>
        Loading visualization…
      </div>
    )
  }

  const { meta } = data

  return (
    <div style={{ color: '#e2e8f0' }}>

      {/* Header */}
      <h2 style={{ color: '#e2e8f0', fontSize: '1.6rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Who Exceeds Expectations?
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem', maxWidth: 700 }}>
        Each bubble is a medal-winning country. Expected medals are modelled from both <strong>GDP per capita</strong> (wealth) and <strong>population</strong> (size) — so large rich nations like the USA get a high baseline. What remains is genuine over- or under-performance.
        Gold bubbles punch above their weight; blue bubbles underperform relative to their wealth.
      </p>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* Season toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['Summer', 'Winter'] as Season[]).map(s => (
            <button
              key={s}
              onClick={() => handleSeasonChange(s)}
              style={{
                padding: '0.4rem 1.2rem',
                borderRadius: 6,
                border: '2px solid #3b82f6',
                background: season === s ? '#3b82f6' : 'transparent',
                color: season === s ? '#fff' : '#3b82f6',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {s === 'Summer' ? '☀️ Summer' : '❄️ Winter'}
            </button>
          ))}
        </div>

        {/* Play/Pause */}
        <button
          onClick={handlePlay}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: 6,
            border: '2px solid #475569',
            background: isPlaying ? '#475569' : 'transparent',
            color: '#e2e8f0',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            minWidth: 90,
          }}
        >
          {isPlaying ? '⏸ Pause' : yearIndex >= years.length - 1 ? '↺ Replay' : '▶ Play'}
        </button>

        {/* Year label */}
        <span style={{
          fontSize: '2rem', fontWeight: 800, color: '#f8fafc',
          letterSpacing: '-0.03em', lineHeight: 1,
          transition: 'opacity 0.3s',
        }}>
          {currentYear}
        </span>

        {/* Pinned country indicator */}
        {pinnedCode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#1e293b', border: '1px solid #f59e0b',
            borderRadius: 20, padding: '4px 12px',
          }}>
            <span>{flagEmoji(pinnedCode)}</span>
            <span style={{ fontSize: 12, color: '#fbbf24' }}>
              {currentYearData.countries.find(c => c.code === pinnedCode)?.country ?? pinnedCode}
            </span>
            <button
              onClick={() => setPinnedCode(null)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Year slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', maxWidth: SVG_W }}>
        <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>{years[0]}</span>
        <input
          type="range"
          min={0}
          max={years.length - 1}
          value={yearIndex}
          onChange={e => {
            setYearIndex(Number(e.target.value))
            setIsPlaying(false)
          }}
          style={{ flex: 1, accentColor: '#3b82f6' }}
        />
        <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>{years[years.length - 1]}</span>
      </div>

      {/* Main layout: scatter + leaderboard */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ScatterPlot
          yearData={currentYearData}
          gdpMin={meta.gdpMin}
          gdpMax={meta.gdpMax}
          ratioMax={meta.ratioMax}
          pinnedCode={pinnedCode}
          allYearData={allYearData}
          currentYearIndex={yearIndex}
          onPin={setPinnedCode}
        />

        <div style={{ paddingTop: 24 }}>
          <Leaderboard countries={currentYearData.countries} />
          <p style={{ marginTop: 16, fontSize: 10, color: '#475569', maxWidth: 220 }}>
            Click any bubble to trace its journey over time.
          </p>
        </div>
      </div>

      {/* Color legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: '1.25rem', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, color: '#64748b', marginRight: 4 }}>Performance vs. expectation:</span>
        {[
          { color: '#f59e0b', label: 'Far above' },
          { color: '#fbbf24', label: 'Above' },
          { color: '#94a3b8', label: 'On par' },
          { color: '#93c5fd', label: 'Below' },
          { color: '#3b82f6', label: 'Far below' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}