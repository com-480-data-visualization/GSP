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
  window_end: number
  total_medals: number
  window_efficiency: number
  window_label: string
}

interface Props {
  width: number
  height: number
}

export default function BarChartRaceSection({ width, height }: Props) {
  const [season, setSeason] = useState<Season>('Summer')

  const c1 = useRef<HTMLDivElement>(null)
  const c2 = useRef<HTMLDivElement>(null)
  const r1 = useRef<RaceAPI | null>(null)
  const r2 = useRef<RaceAPI | null>(null)

  const SIDE_MARGIN = 48                                     // px gutter on left/right
  const inner  = width - SIDE_MARGIN * 2
  const half   = Math.floor(inner / 2)
  const HEADER = 120                                         // px for title + season toggle strip
  const chartH = Math.min(Math.floor(height * 0.8), 620)

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
        background-color: var(--bg) !important;
        background:       var(--bg) !important;
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

        // ── Deduplicate by (country × Olympic year). window_end is the
        //    last Olympic edition in each rolling window — i.e. an actual
        //    Olympic year (1960, 1964, 1968, …). window_start is just the
        //    window boundary and produces non-Olympic years (1963, 1967, …).
        const bestMedals: Record<string, { name: string; date: string; value: number }> = {}
        const bestEff:    Record<string, { name: string; date: string; value: number }> = {}

        for (const row of data) {
          if (!row.country_name || row.window_end == null) continue
          const key  = `${row.country_name}__${row.window_end}`
          const date = `${row.window_end}-01-01`

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
          tickDuration:   1500,
          dateCounter:    (currentDate: string) => currentDate.slice(0, 4),
        }

        // Helper: patch racing-bars inline after it resolves.
        // racing-bars uses max(1vw,12px) for --base-font-size, where vw is the
        // FULL viewport — but each chart is only half the viewport wide.
        // Setting 0.5vw (= 1vw of the half-width container) corrects the scale.
        // Inline style beats the #id{} rule racing-bars injects (no !important needed).
        const patchContainer = (el: HTMLElement) => {
          el.style.setProperty('background-color', 'var(--bg)', 'important')
          el.style.setProperty('--base-font-size', 'max(0.55vw, 11px)')
          const child = el.firstElementChild as HTMLElement | null
          if (child) child.style.setProperty('background-color', 'var(--bg)', 'important')
        }

        if (!cancelled && c1.current) {
          r1.current = await race(medalsData, c1.current, {
            ...common,
            title:          'Total medal count',
            makeCumulative: true,
            controlButtons: 'none',
          })
          if (c1.current) patchContainer(c1.current)
        }

        if (!cancelled && c2.current) {
          r2.current = await race(effData, c2.current, {
            ...common,
            title:          'Relative performance',
            controlButtons: 'all',
          })
          if (c2.current) patchContainer(c2.current)
        }

        // ── Sync: drive the (control-less) left race off the right race's
        //    ticker. Any play/pause/seek on the right propagates to the left,
        //    keeping both timelines in lockstep.
        if (!cancelled && r1.current && r2.current) {
          r2.current.on('dateChange', ({ date }) => {
            r1.current?.setDate(date)
          })
          r2.current.play()
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
      background: 'var(--bg)',
    }}>

      {/* ── Section header: title + season toggle ───────────────────────── */}
      <div style={{
        position:       'absolute',
        top:            0,
        left:           0,
        width,
        height:         HEADER,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
        zIndex:         10,
      }}>
       <h2 style={{ color: 'var(--text)', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-semi)', marginBottom: '0.25rem' }}>
          Olympic efficiency over time
        </h2>
        How did Russia, Hungary and the Ukraine become the relatively best performing countries in the Summer olympics?
        <div style={{ display: 'flex', gap: 10 }}>
          {(['Summer', 'Winter'] as Season[]).map(s => (
            <button key={s} onClick={() => setSeason(s)} style={{
              padding:      '0.3rem 1rem',
              borderRadius: 6,
              border:       '2px solid var(--accent)',
              background:   season === s ? 'var(--accent)' : 'transparent',
              color:        season === s ? '#fff' : 'var(--accent)',
              fontFamily:   'var(--font-sans)',
              fontWeight:   'var(--fw-semi)',
              cursor:       'pointer',
              fontSize:     'var(--fs-sm)',
            }}>
              {s === 'Summer' ? '☀️ Summer' : '❄️ Winter'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Left panel: medals ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top:      HEADER + 40,
        left:     SIDE_MARGIN,
        width:    half,
        height:   chartH,
      }}>
        <div id={C1} ref={c1} style={{ width: half, height: chartH }} />
      </div>

      {/* ── Right panel: efficiency ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top:      HEADER + 40,
        left:     SIDE_MARGIN + half,
        width:    half,
        height:   chartH,
      }}>
        <div id={C2} ref={c2} style={{ width: half, height: chartH }} />
      </div>

    </div>
  )
}
