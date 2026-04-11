import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Papa from 'papaparse'
import './RacingBarChart.css'

// IOC 3-letter → ISO 2-letter for flag emoji generation
const IOC_TO_ISO2: Record<string, string> = {
  AFG: 'af', ALB: 'al', ARE: 'ae', ARG: 'ar', ARM: 'am', AUS: 'au', AUT: 'at',
  AZE: 'az', BDI: 'bi', BEL: 'be', BFA: 'bf', BGR: 'bg', BHS: 'bs', BLR: 'by',
  BMU: 'bm', BRA: 'br', BRB: 'bb', BRN: 'bn', BWA: 'bw', CAN: 'ca', CHE: 'ch',
  CHL: 'cl', CHN: 'cn', CIV: 'ci', CMR: 'cm', COL: 'co', CPV: 'cv', CRI: 'cr',
  CUB: 'cu', CYP: 'cy', CZE: 'cz', DEU: 'de', DJI: 'dj', DMA: 'dm', DNK: 'dk',
  DOM: 'do', DZA: 'dz', ECU: 'ec', EGY: 'eg', ERI: 'er', ESP: 'es', EST: 'ee',
  ETH: 'et', FIN: 'fi', FJI: 'fj', FRA: 'fr', GAB: 'ga', GBR: 'gb', GEO: 'ge',
  GHA: 'gh', GRC: 'gr', GRD: 'gd', GTM: 'gt', GUY: 'gy', HKG: 'hk', HRV: 'hr',
  HUN: 'hu', IDN: 'id', IND: 'in', IRL: 'ie', IRN: 'ir', IRQ: 'iq', ISL: 'is',
  ISR: 'il', ITA: 'it', JAM: 'jm', JOR: 'jo', JPN: 'jp', KAZ: 'kz', KEN: 'ke',
  KGZ: 'kg', KOR: 'kr', KWT: 'kw', LCA: 'lc', LIE: 'li', LKA: 'lk', LTU: 'lt',
  LUX: 'lu', LVA: 'lv', MAR: 'ma', MDA: 'md', MEX: 'mx', MKD: 'mk', MNE: 'me',
  MNG: 'mn', MOZ: 'mz', MUS: 'mu', MYS: 'my', NAM: 'na', NER: 'ne', NGA: 'ng',
  NLD: 'nl', NOR: 'no', NZL: 'nz', PAK: 'pk', PAN: 'pa', PER: 'pe', PHL: 'ph',
  POL: 'pl', PRI: 'pr', PRT: 'pt', PRY: 'py', QAT: 'qa', ROU: 'ro', RUS: 'ru',
  SAU: 'sa', SDN: 'sd', SEN: 'sn', SGP: 'sg', SMR: 'sm', SRB: 'rs', SUR: 'sr',
  SVK: 'sk', SVN: 'si', SWE: 'se', SYR: 'sy', TGO: 'tg', THA: 'th', TJK: 'tj',
  TKM: 'tm', TON: 'to', TTO: 'tt', TUN: 'tn', TUR: 'tr', TZA: 'tz', UGA: 'ug',
  UKR: 'ua', URY: 'uy', USA: 'us', UZB: 'uz', VEN: 've', VNM: 'vn', WSM: 'ws',
  XKX: 'xk', ZAF: 'za', ZMB: 'zm', ZWE: 'zw',
}

function flagEmoji(ioc: string): string {
  const iso2 = IOC_TO_ISO2[ioc]
  if (!iso2) return '🏳'
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

interface Row {
  'Country Code': string
  country_name: string
  window_efficiency: number
  window_label: string
}

interface Props {
  season: 'Summer' | 'Winter'
}

const TOP_N = 15
const FRAME_MS = 1600

export default function RacingBarChart({ season }: Props) {
  const [frames, setFrames] = useState<Record<string, Row[]>>({})
  const [windows, setWindows] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/GSP/data/${season.toLowerCase()}_efficiency.csv`)
      .then(r => r.text())
      .then(csv => {
        const { data } = Papa.parse<Row>(csv, { header: true, dynamicTyping: true, skipEmptyLines: true })
        // Group by window, deduplicating by Country Code (keep best efficiency)
        // Needed because historical split nations (FRG/GDR both → DEU, USSR/Russia → RUS, etc.)
        // can produce multiple rows for the same code in one window.
        const grouped: Record<string, Row[]> = {}
        for (const row of data) {
          if (!row.window_label) continue
          const window = (grouped[row.window_label] ??= [])
          const existing = window.find(r => r['Country Code'] === row['Country Code'])
          if (!existing) {
            window.push(row)
          } else if (row.window_efficiency > existing.window_efficiency) {
            window[window.indexOf(existing)] = row
          }
        }
        for (const wl of Object.keys(grouped)) {
          grouped[wl].sort((a, b) => b.window_efficiency - a.window_efficiency)
        }
        const sorted = Object.keys(grouped).sort()
        setWindows(sorted)
        setFrames(grouped)
        setIdx(0)
      })
  }, [season])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!playing || windows.length === 0) return
    timerRef.current = setInterval(() => {
      setIdx(i => {
        if (i >= windows.length - 1) { setPlaying(false); return i }
        return i + 1
      })
    }, FRAME_MS)
    return () => clearInterval(timerRef.current!)
  }, [playing, windows])

  const currentWindow = windows[idx] ?? ''
  const rows = (frames[currentWindow] ?? []).slice(0, TOP_N)
  const maxVal = rows[0]?.window_efficiency ?? 1

  function restart() {
    setIdx(0)
    setPlaying(true)
  }

  return (
    <div className="rbc">
      <div className="rbc-controls">
        <span className="rbc-window-label">{currentWindow}</span>
        <div className="rbc-buttons">
          {idx === windows.length - 1 && !playing ? (
            <button className="rbc-btn" onClick={restart}>↺ Restart</button>
          ) : (
            <button className="rbc-btn" onClick={() => setPlaying(p => !p)}>
              {playing ? '⏸' : '▶ Play'}
            </button>
          )}
        </div>
        <input
          className="rbc-scrubber"
          type="range"
          min={0}
          max={windows.length - 1}
          value={idx}
          onChange={e => { setPlaying(false); setIdx(+e.target.value) }}
        />
      </div>

      <div className="rbc-bars">
        <AnimatePresence initial={false}>
          {rows.map((row, rank) => (
            <motion.div
              key={row['Country Code']}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ layout: { duration: 0.5, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}
              className="rbc-row"
            >
              <span className="rbc-rank">#{rank + 1}</span>
              <span className="rbc-flag">{flagEmoji(row['Country Code'])}</span>
              <span className="rbc-name">{row.country_name}</span>
              <div className="rbc-bar-track">
                <motion.div
                  className="rbc-bar"
                  animate={{ width: `${(row.window_efficiency / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  style={{ '--rank': rank } as React.CSSProperties}
                />
              </div>
              <span className="rbc-val">{row.window_efficiency.toFixed(2)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
