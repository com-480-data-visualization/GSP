import { useEffect, useRef, useState } from 'react'
import { race } from 'racing-bars'
import Papa from 'papaparse'

type RaceAPI = Awaited<ReturnType<typeof race>>
type Season = 'Summer' | 'Winter'

// ── Stable IDs so the CSS override can target the exact container elements.
// racing-bars generates a unique CSS rule like:
//   __selector__ { background-color: #1e1e1e }
// where __selector__ resolves to whichever element (container or a created
// child) it treats as its root.  We cover BOTH by targeting the container
// itself AND its first child, using !important on an ID rule (highest
// non-inline specificity) so it wins regardless of what racing-bars does.
const C1 = 'rb-chart-medals'
const C2 = 'rb-chart-efficiency'

interface CsvRow {
  'Country Code': string
  country_name: string
  window_start: number
  total_medals: number
  window_efficiency: number
  window_label: string
}

interface Props {
  width: number
  height: number
  split: boolean
}

export default function BarChartRaceSection({ width, height, split }: Props) {
  const [season, setSeason] = useState<Season>('Summer')

  const c1 = useRef<HTMLDivElement>(null)
  const c2 = useRef<HTMLDivElement>(null)
  const r1 = useRef<RaceAPI | null>(null)
  const r2 = useRef<RaceAPI | null>(null)

  const half   = Math.floor(width / 2)
  const HEADER = 72                                          // px for season toggle strip
  // Cap chart height so bars stay a reasonable size on tall monitors.
  // Leave at least HEADER + 32 px of margin inside the sticky viewport.
  const chartH = Math.min(Math.floor(height * 0.85), 620)

  // ── Permanent background override injected once on mount ─────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'rb-bg-fix'
    // Target the container div AND its immediate child (whichever one
    // racing-bars treats as the chart root and applies its background to).
    // We do NOT use `> *` deeper than one level so bar colours are untouched.
    style.textContent = `
      #${C1},
      #${C1} > :first-child,
      #${C2},
      #${C2} > :first-child {
        background-color: #000d1f !important;
        background:       #000d1f !important;
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  useEffect(() => {
    if (!c1.current || !c2.current) return
    let cancelled = false

    r1.current?.destroy(); r1.current = null
    r2.current?.destroy(); r2.current = null

    Papa.parse<CsvRow>(`/GSP/data/${season.toLowerCase()}_efficiency.csv`, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        if (cancelled) return

        // ── Deduplicate: per (country_name × window_start) keep best row ──
        const bestMedals: Record<string, { name: string; date: string; value: number }> = {}
        const bestEff:    Record<string, { name: string; date: string; value: number }> = {}

        for (const row of data) {
          if (!row.country_name || row.window_start == null) continue
          const key  = `${row.country_name}__${row.window_start}`
          const date = `${row.window_start}-01-01`

          if (!bestMedals[key] || row.total_medals > bestMedals[key].value)
            bestMedals[key] = { name: row.country_name, date, value: row.total_medals ?? 0 }

          if (!bestEff[key] || row.window_efficiency > bestEff[key].value)
            bestEff[key] = {
              name: row.country_name,
              date,
              value: Math.round((row.window_efficiency ?? 0) * 100) / 100,
            }
        }

        const medalsData = Object.values(bestMedals).filter(d => d.value > 0)
        const effData    = Object.values(bestEff).filter(d => d.value > 0)

        const common = {
          autorun:        false,
          loop:           true,
          topN:           10,
          theme:          'dark' as const,
          tickDuration:   700,
          controlButtons: 'all' as const,
        }

        // Helper: patch racing-bars inline after it resolves.
        // racing-bars uses max(1vw,12px) for --base-font-size, where vw is the
        // FULL viewport — but each chart is only half the viewport wide.
        // Setting 0.5vw (= 1vw of the half-width container) corrects the scale.
        // Inline style beats the #id{} rule racing-bars injects (no !important needed).
        const patchContainer = (el: HTMLElement) => {
          el.style.setProperty('background-color', '#000d1f', 'important')
          el.style.setProperty('--base-font-size', 'max(0.55vw, 11px)')
          const child = el.firstElementChild as HTMLElement | null
          if (child) child.style.setProperty('background-color', '#000d1f', 'important')
        }

        if (!cancelled && c1.current) {
          r1.current = await race(medalsData, c1.current, {
            ...common,
            title: 'The most successful countries at the Olympics',
            makeCumulative: true,
          })
          if (c1.current) patchContainer(c1.current)
        }

        if (!cancelled && c2.current) {
          r2.current = await race(effData, c2.current, {
            ...common,
            title: 'But if we look at efficiency…',
          })
          if (c2.current) patchContainer(c2.current)
        }

        if (!cancelled) {
          r1.current?.play()
          r2.current?.play()
        }
      },
    })

    return () => {
      cancelled = true
      r1.current?.destroy(); r1.current = null
      r2.current?.destroy(); r2.current = null
    }
  }, [season])

  return (
    <div style={{
      position:   'sticky',
      top:        0,
      width,
      height,
      overflow:   'clip',
      background: '#000d1f',
    }}>

      {/* ── Season toggle — centred at top ───────────────────────────────── */}
      <div style={{
        position:       'absolute',
        top:            0,
        left:           0,
        width,
        height:         HEADER,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            10,
        zIndex:         10,
      }}>
        {(['Summer', 'Winter'] as Season[]).map(s => (
          <button key={s} onClick={() => setSeason(s)} style={{
            padding:      '0.3rem 1rem',
            borderRadius: 6,
            border:       '2px solid #3b82f6',
            background:   season === s ? '#3b82f6' : 'transparent',
            color:        season === s ? '#fff' : '#3b82f6',
            fontWeight:   600,
            cursor:       'pointer',
            fontSize:     '0.85rem',
          }}>
            {s === 'Summer' ? '☀️ Summer' : '❄️ Winter'}
          </button>
        ))}
      </div>

      {/* ── Left panel: medals ─────────────────────────────────────────────
           Starts centred (translateX = width/4), slides left on split.    */}
      <div style={{
        position:   'absolute',
        top:        HEADER,
        left:       0,
        width:      half,
        height:     chartH,
        transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
        transform:  split ? 'translateX(0)' : `translateX(${width / 4}px)`,
      }}>
        <div id={C1} ref={c1} style={{ width: half, height: chartH }} />
      </div>

      {/* ── Right panel: efficiency ────────────────────────────────────────
           Starts off-screen right, slides in on split.                    */}
      <div style={{
        position:   'absolute',
        top:        HEADER,
        left:       half,
        width:      half,
        height:     chartH,
        transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease',
        transform:  split ? 'translateX(0)' : `translateX(${half}px)`,
        opacity:    split ? 1 : 0,
      }}>
        <div id={C2} ref={c2} style={{ width: half, height: chartH }} />
      </div>

      {/* ── Scroll hint ───────────────────────────────────────────────────── */}
      <div style={{
        position:      'absolute',
        bottom:        24,
        left:          0,
        width,
        textAlign:     'center',
        color:         'rgba(255,255,255,0.55)',
        fontSize:      15,
        fontFamily:    'sans-serif',
        pointerEvents: 'none',
        transition:    'opacity 0.4s ease',
        opacity:       split ? 0 : 1,
      }}>
        Scroll to reveal the efficiency story
      </div>

    </div>
  )
}
