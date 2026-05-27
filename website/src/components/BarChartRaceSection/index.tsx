import React, { useEffect, useRef, useState } from 'react'
import { race } from 'racing-bars'
import type { GapminderData, Season } from '../../types/olympics'
import { buildRaceSeries } from '../../data/buildRaceSeries'
import { buildColorMap } from '../../theme/raceColors'
import RaceControls from './RaceControls'
import ReferenceLine from './ReferenceLine'

type RaceAPI = Awaited<ReturnType<typeof race>>

// Stable element IDs so the CSS background override can target the exact
// containers racing-bars injects its styles into.
const CHART_ID_MEDALS     = 'rb-chart-medals'
const CHART_ID_EFFICIENCY = 'rb-chart-efficiency'

interface Props {
  width:  number
  height: number
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const SIDE_MARGIN = 48   // px gutter on each side
const HEADER_H    = 210  // px for title + subtitle + controls strip

export default function BarChartRaceSection({ width, height }: Props) {
  const [season,        setSeason]        = useState<Season>('Summer')
  const [speed2x,       setSpeed2x]       = useState(false)
  const [allDates,      setAllDates]      = useState<string[]>([])
  const [dateIdx,       setDateIdx]       = useState(0)
  const [maxEfficiency, setMaxEfficiency] = useState(0)
  const [playing,       setPlaying]       = useState(false)

  const sliderRef = useRef<HTMLInputElement>(null)
  const c1 = useRef<HTMLDivElement>(null)
  const c2 = useRef<HTMLDivElement>(null)
  const r1 = useRef<RaceAPI | null>(null)
  const r2 = useRef<RaceAPI | null>(null)

  const half   = Math.floor((width - SIDE_MARGIN * 2) / 2)
  const chartH = height - HEADER_H - 60   // fill available space with 60px bottom breathing room

  // ── Inject background override once on mount ────────────────────────────────
  // racing-bars forces a dark background on its root element. We override with
  // !important so the chart blends into our page background seamlessly.
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'rb-bg-fix'
    style.textContent = `
      #${CHART_ID_MEDALS},     #${CHART_ID_MEDALS}     > :first-child,
      #${CHART_ID_EFFICIENCY}, #${CHART_ID_EFFICIENCY} > :first-child {
        background-color: var(--bg) !important;
        background:       var(--bg) !important;
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  // ── Initialise / re-initialise both race instances ─────────────────────────
  useEffect(() => {
    if (!c1.current || !c2.current) return
    let cancelled = false

    r1.current?.destroy(); r1.current = null
    r2.current?.destroy(); r2.current = null

    fetch(import.meta.env.BASE_URL + 'data/gapminder_scatter.json')
      .then(res => res.json() as Promise<GapminderData>)
      .then(async (data) => {
        if (cancelled) return

        const { medals: medalsData, efficiency: effData } = buildRaceSeries(data, season)

        const allNames = new Set([...medalsData.map(d => d.name), ...effData.map(d => d.name)])
        const colorMap = buildColorMap([...allNames])
        const maxEff   = effData.reduce((m, d) => Math.max(m, d.value), 1)
        setMaxEfficiency(maxEff)

        // racing-bars uses 1vw based on full viewport, but each chart is half
        // the viewport wide. Patching --base-font-size corrects text scaling.
        const patchContainer = (el: HTMLElement) => {
          el.style.setProperty('background-color', 'var(--bg)', 'important')
          el.style.setProperty('--base-font-size', 'max(0.55vw, 11px)')
          const child = el.firstElementChild as HTMLElement | null
          if (child) child.style.setProperty('background-color', 'var(--bg)', 'important')
        }

        const common = {
          autorun:        false,
          loop:           false,
          topN:           8,
          theme:          'dark' as const,
          tickDuration:   speed2x ? 600 : 1000,
          fixedScale:     true,
          dateCounter:    () => '',   // we render the year ourselves next to the slider
          showIcons:      false,
          labelsPosition: 'outside' as const,
          colorMap,
        }

        if (!cancelled && c1.current) {
          r1.current = await race(medalsData, c1.current, {
            ...common,
            title:          'Total medal count since 1960',
            controlButtons: 'none',
          })
          if (c1.current) patchContainer(c1.current)
        }

        if (!cancelled && c2.current) {
          r2.current = await race(effData, c2.current, {
            ...common,
            fixedScale:     false,
            title:          'Cumulative actual / expected medals',
            controlButtons: 'none',
          })
          if (c2.current) patchContainer(c2.current)
        }

        if (!cancelled && r1.current && r2.current) {
          const dates = r2.current.getAllDates()
          setAllDates(dates)
          setDateIdx(0)
          if (sliderRef.current) sliderRef.current.value = '0'

          const firstDate = dates[0]
          if (firstDate) {
            r1.current.setDate(firstDate)
            r2.current.setDate(firstDate)
          }

          // Keep slider and year display in sync — no setDate on r1 during
          // playback so its CSS transitions are never interrupted.
          r2.current.on('dateChange', ({ date }) => {
            const idx = Math.max(0, dates.indexOf(date))
            if (sliderRef.current) sliderRef.current.value = String(idx)
            setDateIdx(idx)
          })

          window.requestAnimationFrame(() => {
            r1.current?.play()
            r2.current?.play()
            setPlaying(true)
          })
        }
      })

    return () => {
      cancelled = true
      r1.current?.destroy(); r1.current = null
      r2.current?.destroy(); r2.current = null
    }
  }, [season, speed2x])

  // ── Playback helpers (passed to RaceControls) ──────────────────────────────
  const handleSkipToStart = () => {
    const date = allDates[0]
    if (!date) return
    r1.current?.pause(); r2.current?.pause()
    r1.current?.setDate(date); r2.current?.setDate(date)
    setDateIdx(0); setPlaying(false)
    if (sliderRef.current) sliderRef.current.value = '0'
  }

  const handleTogglePlay = () => {
    if (playing) {
      r1.current?.pause(); r2.current?.pause(); setPlaying(false)
    } else {
      r1.current?.play(); r2.current?.play(); setPlaying(true)
    }
  }

  const handleSkipToEnd = () => {
    const date = allDates[allDates.length - 1]
    if (!date) return
    r1.current?.pause(); r2.current?.pause()
    r1.current?.setDate(date); r2.current?.setDate(date)
    setDateIdx(allDates.length - 1); setPlaying(false)
    if (sliderRef.current) sliderRef.current.value = String(allDates.length - 1)
  }

  const handleSliderChange = (idx: number) => {
    setDateIdx(idx)
    const date = allDates[idx]
    if (!date) return
    r1.current?.pause(); r2.current?.pause(); setPlaying(false)
    r1.current?.setDate(date); r2.current?.setDate(date)
  }

  const seasonBtnStyle = (active: boolean): React.CSSProperties => ({
    padding:      '0.3rem 1rem',
    borderRadius: 6,
    border:       '2px solid var(--accent)',
    background:   active ? 'var(--accent)' : 'transparent',
    color:        active ? '#fff' : 'var(--accent)',
    fontFamily:   'var(--font-sans)',
    fontWeight:   'var(--fw-semi)',
    cursor:       'pointer',
    fontSize:     'var(--fs-sm)',
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position:   'sticky',
      top:        0,
      width,
      height,
      overflow:   'clip',
      background: 'var(--bg)',
    }}>

      {/* ── Header: title, description, season/speed toggles, playback controls */}
      <div style={{
        position:       'absolute',
        top:            0,
        left:           0,
        width,
        height:         HEADER_H,
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
        <span style={{ color: 'var(--text)', fontWeight: 'var(--fw-semi)', fontSize: 'var(--fs-md)' }}>
          Which countries exceed expectations?
        </span>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Efficiency = cumulative actual medals / cumulative expected medals</span>
          <span style={{ color: 'var(--accent)', fontWeight: 'var(--fw-semi)' }}>1 = expected</span>
          <span>Higher = outperforming</span>
        </div>

        {/* Season + speed toggles */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(['Summer', 'Winter'] as Season[]).map(s => (
            <button key={s} onClick={() => setSeason(s)} style={seasonBtnStyle(season === s)}>
              {s === 'Summer' ? '☀️ Summer' : '❄️ Winter'}
            </button>
          ))}
          <button onClick={() => setSpeed2x(v => !v)} style={seasonBtnStyle(speed2x)}>
            {speed2x ? '2x' : '1x'}
          </button>
        </div>

        <RaceControls
          allDates={allDates}
          dateIdx={dateIdx}
          playing={playing}
          sliderRef={sliderRef}
          onSkipToStart={handleSkipToStart}
          onTogglePlay={handleTogglePlay}
          onSkipToEnd={handleSkipToEnd}
          onSliderChange={handleSliderChange}
        />
      </div>

      {/* ── Left panel: total medals ───────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top:      HEADER_H + 40,
        left:     SIDE_MARGIN,
        width:    half,
        height:   chartH,
      }}>
        <div
          id={CHART_ID_MEDALS}
          ref={c1}
          style={{ width: half, height: chartH, willChange: 'transform', contain: 'layout style' }}
        />
      </div>

      {/* ── Right panel: efficiency ────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top:      HEADER_H + 40,
        left:     SIDE_MARGIN + half,
        width:    half,
        height:   chartH,
      }}>
        <div
          id={CHART_ID_EFFICIENCY}
          ref={c2}
          style={{ width: half, height: chartH, willChange: 'transform', contain: 'layout style' }}
        />
        <ReferenceLine maxEfficiency={maxEfficiency} chartWidth={half} />
      </div>

    </div>
  )
}
