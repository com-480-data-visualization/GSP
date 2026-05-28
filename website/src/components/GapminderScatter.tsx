import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import type { OlympicCountryRecord as CountryPoint, YearData, GapminderData, Season } from '../types/olympics'
import { iocToFlagEmoji as flagEmoji } from '../data/countryMaps'

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

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN     = { top: 24, right: 24, bottom: 56, left: 64 }
const PLOT_H     = 460
const GDP_TICKS  = [100, 300, 1000, 3000, 10000, 30000, 100000]
const RATIO_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function bubbleRadius(medals: number): number {
  return Math.max(4, Math.sqrt(medals) * 2.4)
}

// ─── Color legend (above chart) ───────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: '#f59e0b', label: 'Far above' },
  { color: '#fbbf24', label: 'Above' },
  { color: '#94a3b8', label: 'On par' },
  { color: '#93c5fd', label: 'Below' },
  { color: '#3b82f6', label: 'Far below' },
]

function ColorLegend() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: '1rem', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-dim)', marginRight: 4 }}>
        Performance vs. expectation:
      </span>
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── How-to-use hints ────────────────────────────────────────────────────────

const HINTS = [
  { glyph: '○', label: 'Hover', detail: 'a bubble to see country details' },
  { glyph: '◉', label: 'Click', detail: 'to pin and trace its path over time' },
  { glyph: '▶', label: 'Play', detail: 'to animate through history from 1960-2024' },
]

// ─── Scatter plot ─────────────────────────────────────────────────────────────

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
  currentYear: number | string
  plotWidth: number
  onPin: (code: string | null) => void
}

function ScatterPlot({ yearData, gdpMin, gdpMax, ratioMax, pinnedCode, allYearData, currentYearIndex, currentYear, plotWidth, onPin }: ScatterPlotProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const PLOT_W = plotWidth
  const SVG_W  = PLOT_W + MARGIN.left + MARGIN.right
  const SVG_H  = PLOT_H + MARGIN.top  + MARGIN.bottom

  const xPos = useCallback(
    (gdp: number) => logScale(gdp, gdpMin, gdpMax, 0, PLOT_W),
    [gdpMin, gdpMax, PLOT_W]
  )
  const yPos = useCallback(
    (ratio: number) => linearScale(Math.min(ratio, ratioMax), 0, ratioMax, PLOT_H, 0),
    [ratioMax]
  )

  const baselineY = yPos(1)

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
        y: e.clientY - rect.top  - MARGIN.top,
        point,
      })
    },
    []
  )

  const labelled = new Set(
    [...yearData.countries].sort((a, b) => b.ratio - a.ratio).slice(0, 6).map(c => c.code)
  )

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={SVG_W}
        height={SVG_H}
        style={{ overflow: 'visible', maxWidth: '100%', display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* Ghost year watermark — Gapminder style */}
          <text
            x={PLOT_W - 4}
            y={PLOT_H - 10}
            textAnchor="end"
            fill="var(--text)"
            fontSize={100}
            fontWeight={800}
            opacity={0.07}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {currentYear}
          </text>

          {/* Background shading */}
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

          {/* Baseline label — left-aligned with background pill, more visible */}
          <rect x={2} y={baselineY - 17} width={84} height={15} rx={2}
            fill="var(--bg-panel)" fillOpacity={0.85} />
          <text x={6} y={baselineY - 5} fill="#cbd5e1" fontSize={10} fontWeight={600}>
            1× expected
          </text>

          {/* Trajectory for pinned country */}
          {trajectoryPoints.length > 1 && (
            <polyline
              points={trajectoryPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="#f59e0b" strokeWidth={1.5}
              strokeOpacity={0.55} strokeDasharray="4,3" />
          )}

          {/* Bubbles */}
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
            top:  tooltip.y + MARGIN.top  - 10,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'var(--font-sans)',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 170,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text)', fontSize: 'var(--fs-sm)', marginBottom: 4 }}>
            {flagEmoji(tooltip.point.code)} {tooltip.point.country}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', lineHeight: 1.7 }}>
            <div>GDP/capita: <span style={{ color: 'var(--text)' }}>${tooltip.point.gdp_per_capita.toLocaleString()}</span></div>
            <div>Population: <span style={{ color: 'var(--text)' }}>{tooltip.point.population.toFixed(1)}M</span></div>
            <div>Actual medals: <span style={{ color: 'var(--text)' }}>{tooltip.point.medal_count}</span></div>
            <div>Expected medals: <span style={{ color: 'var(--text)' }}>{tooltip.point.predicted}</span></div>
            <div style={{ marginTop: 4, fontWeight: 'var(--fw-semi)', color: zscoreColor(tooltip.point.zscore) }}>
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
  const top5    = countries.slice(0, 4)
  const bottom5 = [...countries].sort((a, b) => a.zscore - b.zscore).slice(0, 4)

  const Row = ({ c }: { c: CountryPoint }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0',
      borderBottom: '1px solid var(--border-soft)',
      fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ fontSize: 'var(--fs-base)' }}>{flagEmoji(c.code)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)', fontWeight: 'var(--fw-semi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.country}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-dim)' }}>
          {c.medal_count} medals · {c.predicted} expected
        </div>
      </div>
      <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: zscoreColor(c.zscore), flexShrink: 0 }}>
        {c.ratio.toFixed(1)}×
      </div>
    </div>
  )

  return (
    <div style={{ width: 220, fontFamily: 'var(--font-sans)' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--gold)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
        }}>
          Over-performers
        </div>
        {top5.map(c => <Row key={c.code} c={c} />)}
      </div>
      <div>
        <div style={{
          fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, marginTop: 16,
        }}>
          Under-performers
        </div>
        {bottom5.map(c => <Row key={c.code} c={c} />)}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GapminderScatter() {
  const [data,        setData]        = useState<GapminderData | null>(null)
  const [season,      setSeason]      = useState<Season>('Summer')
  const [yearIndex,   setYearIndex]   = useState(0)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [pinnedCode,  setPinnedCode]  = useState<string | null>(null)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  // Responsive plot width via ResizeObserver on the chart column
  const chartColRef    = useRef<HTMLDivElement>(null)
  const aboveSliderRef = useRef<HTMLDivElement>(null)
  const [plotWidth,      setPlotWidth]      = useState(820)
  const [leaderboardTop, setLeaderboardTop] = useState(0)

  useEffect(() => {
    const el = chartColRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width)
      setPlotWidth(Math.max(380, w - 4))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = aboveSliderRef.current
    if (!el) return
    const update = () => setLeaderboardTop(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data])

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/gapminder_scatter.json')
      .then(r => r.json())
      .then((d: GapminderData) => { setData(d); setYearIndex(0) })
      .catch(err => console.error('Failed to load gapminder data:', err))
  }, [])

  const seasonData    = data?.[season]
  const years         = seasonData?.years ?? []
  const currentYear   = years[yearIndex]
  const currentYearData = currentYear ? seasonData?.byYear[String(currentYear)] : null
  const allYearData   = years.map(y => seasonData!.byYear[String(y)])

  useEffect(() => {
    if (!isPlaying) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setYearIndex(prev => {
        if (prev >= years.length - 1) { setIsPlaying(false); return prev }
        return prev + 1
      })
    }, 1200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, years.length])

  const handleSeasonChange = (s: Season) => {
    setSeason(s); setYearIndex(0); setIsPlaying(false); setPinnedCode(null)
  }

  const handlePlay = () => {
    if (yearIndex >= years.length - 1) setYearIndex(0)
    setIsPlaying(p => !p)
  }

  if (!data || !currentYearData) {
    return (
      <div style={{ color: 'var(--text-dim)', padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        Loading visualization…
      </div>
    )
  }

  const { meta } = data
  const svgTotalW  = plotWidth + MARGIN.left + MARGIN.right

  return (
    <div style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

      <div ref={chartColRef} style={{ flex: '1 1 0%', minWidth: 0 }}>

        {/* Everything above the play button — measured so leaderboard aligns with it */}
        <div ref={aboveSliderRef} style={{ overflow: 'hidden' }}>

        {/* Header */}
        <h2 style={{ color: 'var(--text)', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-semi)', marginBottom: '0.25rem' }}>
          Who exceeded Olympic expectations?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: 'var(--fs-sm)', maxWidth: 700 }}>
          Each bubble is a medal-winning country, sized by medals won. Gold bubbles punch above their weight;
          blue bubbles underperform relative to their wealth and population.
        </p>

        {/* Pinned indicator */}
        {pinnedCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-panel)', border: '1px solid var(--gold)',
              borderRadius: 20, padding: '4px 12px',
            }}>
              <span>{flagEmoji(pinnedCode)}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--gold-soft)' }}>
                {currentYearData.countries.find(c => c.code === pinnedCode)?.country ?? pinnedCode}
              </span>
              <button
                onClick={() => setPinnedCode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 'var(--fs-sm)', padding: 0 }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        </div>{/* end aboveSliderRef */}

        {/* Year slider + season toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', maxWidth: svgTotalW }}>
          <span style={{
            fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text)',
            letterSpacing: '-0.03em', lineHeight: 1, flexShrink: 0, minWidth: 64,
          }}>
            {currentYear}
          </span>
          <button
            onClick={handlePlay}
            style={{
              padding: '0.4rem 1rem', borderRadius: 6,
              border: '2px solid var(--text-faint)',
              background: isPlaying ? 'var(--text-faint)' : 'transparent',
              color: 'var(--text)', fontFamily: 'var(--font-sans)',
              fontWeight: 'var(--fw-semi)', cursor: 'pointer',
              fontSize: 'var(--fs-sm)', minWidth: 90, flexShrink: 0,
            }}
          >
            {isPlaying ? '⏸ Pause' : yearIndex >= years.length - 1 ? '↺ Replay' : '▶ Play'}
          </button>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-dim)', flexShrink: 0 }}>{years[0]}</span>
          <input
            type="range" min={0} max={years.length - 1} value={yearIndex}
            onChange={e => { setYearIndex(Number(e.target.value)); setIsPlaying(false) }}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-dim)', flexShrink: 0 }}>{years[years.length - 1]}</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '0.5rem' }}>
            {(['Summer', 'Winter'] as Season[]).map(s => (
              <button
                key={s}
                onClick={() => handleSeasonChange(s)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: 6,
                  border: '2px solid var(--accent)',
                  background: season === s ? 'var(--accent)' : 'transparent',
                  color: season === s ? '#fff' : 'var(--accent)',
                  fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semi)',
                  cursor: 'pointer', fontSize: 'var(--fs-sm)',
                }}
              >
                {s === 'Summer' ? '☀️ Summer' : '❄️ Winter'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart — column wrapper guarantees legend is always above the SVG */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ColorLegend />
          <ScatterPlot
            yearData={currentYearData}
            gdpMin={meta.gdpMin}
            gdpMax={meta.gdpMax}
            ratioMax={meta.ratioMax}
            pinnedCode={pinnedCode}
            allYearData={allYearData}
            currentYearIndex={yearIndex}
            currentYear={currentYear}
            plotWidth={plotWidth}
            onPin={setPinnedCode}
          />
          {/* How-to-use strip */}
          <div style={{
            display: 'block',
            padding: '9px 14px',
            background: 'var(--bg-elev)',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            marginTop: '1rem',
            fontSize: 'var(--fs-xs)',
            lineHeight: 1.8,
          }}>
            <span style={{ color: 'var(--text-faint)', fontWeight: 'var(--fw-semi)' }}>How to use —</span>
            {HINTS.map(({ glyph, label, detail }, i) => (
              <span key={label}>
                {' '}
                <span style={{ color: 'var(--accent-soft)' }}>{glyph}</span>
                {' '}
                <span style={{ color: 'var(--text-soft)', fontWeight: 'var(--fw-semi)' }}>{label}</span>
                {' '}
                <span style={{ color: 'var(--text-dim)' }}>{detail}</span>
                {i < HINTS.length - 1 && <span style={{ color: 'var(--text-faint)' }}> ·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ flexShrink: 0, marginTop: leaderboardTop }}>
        <Leaderboard countries={currentYearData.countries} />
      </div>
    </div>
  )
}
