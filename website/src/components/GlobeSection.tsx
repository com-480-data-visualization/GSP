import { useState, useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'
import { iso2ToFlagEmoji } from '../data/countryMaps'

interface CountryProperties {
  ADMIN: string
  ISO_A2: string
  ISO_A3: string
  ADM0_A3: string
  NAME_LONG: string
}

interface CountryGeometry {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

interface CountryFeature {
  properties: CountryProperties
  geometry?: CountryGeometry
}

interface CountriesData {
  features: CountryFeature[]
}

function geoKey(p: CountryProperties) {
  return p.NAME_LONG
}

// Map a normalised value [0,1] to bronze→silver→gold (low→high)
function medalColor(t: number): string {
  // bronze (205,127,50) → silver (192,192,192) → gold (255,215,0)
  let r: number, g: number, b: number
  if (t < 0.5) {
    const s = t / 0.5
    r = Math.round(205 - s * 13)
    g = Math.round(127 + s * 65)
    b = Math.round(50 + s * 142)
  } else {
    const s = (t - 0.5) / 0.5
    r = Math.round(192 + s * 63)
    g = Math.round(192 + s * 23)
    b = Math.round(192 - s * 192)
  }
  return `rgba(${r},${g},${b},0.85)`
}

interface GlobeSectionProps {
  width: number
  height: number
  split: boolean
}

interface CountryMarker {
  name: string
  key: string
  lat: number
  lng: number
}

// ── HTML marker item union ────────────────────────────────────────────────────
type GlobeHtmlItem =
  | { kind: 'static'; name: string; key: string; lat: number; lng: number; label: string }
  | { kind: 'hover';  lat: number; lng: number; line: string }

// Compute geographic centroid from GeoJSON geometry
function computeCentroid(geometry: CountryGeometry): { lat: number; lng: number } | null {
  let coords: number[][] = []
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0] as number[][]
  } else {
    // MultiPolygon — pick the largest ring by vertex count
    let maxLen = 0
    for (const poly of geometry.coordinates as number[][][][]) {
      if (poly[0] && poly[0].length > maxLen) {
        maxLen = poly[0].length
        coords  = poly[0] as unknown as number[][]
      }
    }
  }
  if (!coords.length) return null
  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const lat  = coords.reduce((s, c) => s + c[1], 0) / coords.length
  return { lat, lng }
}

/** Stats derived at data-load time, needed to recompute colours on hover. */
interface DataStats {
  maxMedals: number
  minZ: number
  maxZ: number
}

/** Country currently under the cursor. */
interface HoveredInfo {
  name: string   // NAME_LONG — matches medals / avgZscore keys
  iso2: string   // for flag emoji
}

const GLOBE1_COUNTRIES: CountryMarker[] = [
  { name: 'US',      key: 'United States', lat: 43,  lng: -98.6 },
  { name: 'China',   key: 'China',         lat: 38,  lng: 105.0 },
  { name: 'Germany', key: 'Germany',       lat: 53,  lng: 10.5  },
]

const GLOBE2_COUNTRIES: CountryMarker[] = [
  { name: 'Kenya',   key: 'Kenya',   lat: 3,  lng: 37.9 },
  { name: 'Hungary', key: 'Hungary', lat: 49, lng: 19.5 },
]

// Precomputed gradient stops for the bronze→silver→gold legend
const MEDAL_GRADIENT = (() => {
  const stops = [0, 0.25, 0.5, 0.75, 1].map(t => medalColor(t))
  return `linear-gradient(90deg, ${stops.map((c, i) => `${c} ${i * 25}%`).join(', ')})`
})()

function makeMarkerElement(label: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = [
    'pointer-events: none',
    'transform: translate(-50%, -130%)',
    'position: relative',
    'background: rgba(0,0,0,0.72)',
    'color: #fff',
    'font-family: system-ui, sans-serif',
    'font-size: 11px',
    'font-weight: 600',
    'white-space: nowrap',
    'padding: 3px 8px',
    'border-radius: 10px',
    'line-height: 1.4',
    'border: 1px solid rgba(255,255,255,0.25)',
  ].join(';')
  el.innerHTML = `
    ${label}
    <div style="position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.8)"></div>
  `
  return el
}

// Hover label — rendered directly on the hovered country on both globes
function makeHoverLabelElement(line: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = [
    'pointer-events: none',
    'transform: translate(-50%, -50%)',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';')
  el.innerHTML = `
    <div style="background:rgba(0,8,24,0.88);color:#fff;font-family:system-ui,sans-serif;font-size:13px;font-weight:700;white-space:nowrap;padding:5px 12px;border-radius:12px;line-height:1.4;border:1.5px solid rgba(255,255,255,0.38);box-shadow:0 2px 12px rgba(0,0,0,0.6)">${line}</div>
  `
  return el
}

export default function GlobeSection({ width, height, split }: GlobeSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl  = useRef<any>(undefined!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl2 = useRef<any>(undefined!)

  // Suppress all CSS transitions on the initial render so the globes don't
  // "flicker in" to their starting position when the page is refreshed.
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const [cursor,             setCursor]             = useState<'grab' | 'grabbing' | 'auto'>('auto')
  const draggingRef                                  = useRef(false)
  const [countries,          setCountries]          = useState<CountriesData>({ features: [] })
  const [medals,             setMedals]             = useState<Record<string, number>>({})
  const [avgZscore,          setAvgZscore]          = useState<Record<string, number>>({})
  const [altitude,           setAltitude]           = useState<{ value: number | ((feat: object) => number) }>({ value: 0.01 })
  const [capColor,           setCapColor]           = useState<{ fn: (feat: object) => string }>({ fn: () => 'rgba(100,100,100,0.6)' })
  const [capColor2,          setCapColor2]          = useState<{ fn: (feat: object) => string }>({ fn: () => 'rgba(100,100,100,0.6)' })
  const [transitionDuration, setTransitionDuration] = useState(1000)

  // Hover state — shared between both globes
  const [hoveredInfo, setHoveredInfo] = useState<HoveredInfo | null>(null)
  // Stats needed to recompute colour functions on hover
  const [dataStats,   setDataStats]   = useState<DataStats | null>(null)
  // GeoJSON centroids keyed by NAME_LONG — for on-country hover labels
  const [centroids,   setCentroids]   = useState<Record<string, { lat: number; lng: number }>>({})

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/GSP/ne_110m_admin_0_countries.geojson').then(r => r.json()),
      fetch('/GSP/efficiency_by_country.csv').then(r => r.text()),
      fetch('/GSP/data/gapminder_scatter.json').then(r => r.json()),
    ]).then(([geoData, efficiencyCsv, gapminderData]: [
      CountriesData,
      string,
      { Summer: { byYear: Record<string, { countries: { country: string; zscore: number }[] }> } },
    ]) => {
      setCountries(geoData)

      // Precompute country centroids for on-globe hover labels
      const centroidsMap: Record<string, { lat: number; lng: number }> = {}
      for (const feat of geoData.features) {
        if (!feat.geometry) continue
        const c = computeCentroid(feat.geometry)
        if (c) centroidsMap[geoKey(feat.properties)] = c
      }
      setCentroids(centroidsMap)

      const medalData: Record<string, number> = {}
      for (const line of efficiencyCsv.trim().split('\n').slice(1)) {
        const [country, , medalValue] = line.split(',')
        const m = parseInt(medalValue)
        if (country && !isNaN(m)) medalData[country] = m
      }
      setMedals(medalData)

      // Average z-score per country across all Summer years
      const zscoreSum:   Record<string, number> = {}
      const zscoreCount: Record<string, number> = {}
      for (const yearData of Object.values(gapminderData.Summer.byYear)) {
        for (const { country, zscore } of yearData.countries) {
          zscoreSum[country]   = (zscoreSum[country]   ?? 0) + zscore
          zscoreCount[country] = (zscoreCount[country] ?? 0) + 1
        }
      }
      const zscoreData: Record<string, number> = {}
      for (const country of Object.keys(zscoreSum)) {
        zscoreData[country] = zscoreSum[country] / zscoreCount[country]
      }
      setAvgZscore(zscoreData)

      const maxMedals = Math.max(...Object.values(medalData))
      const zValues   = Object.values(zscoreData)
      const minZ      = Math.min(...zValues)
      const maxZ      = Math.max(...zValues)

      setTimeout(() => {
        setTransitionDuration(2000)
        setAltitude({ value: (feat: object) => {
          const f = feat as CountryFeature
          const total = medalData[geoKey(f.properties)] ?? 0
          return Math.max(0.005, Math.sqrt(total) * 1.5e-3)
        }})
        // Trigger the colour effect for the first time
        setDataStats({ maxMedals, minZ, maxZ })
        // Drop to 0 after the entry animation so hover colour changes
        // are instant and don't trigger a per-polygon pop on every country.
        setTimeout(() => setTransitionDuration(0), 2500)
      }, 1000)
    })
  }, [])

  // ── Colour functions ─────────────────────────────────────────────────────────
  // Recomputed whenever the hovered country, underlying data, or stats change.
  // dataStats is null until the 1 s timeout fires, which keeps colours grey
  // until the altitude animation starts (matching the original behaviour).
  useEffect(() => {
    if (!dataStats) return
    const { maxMedals, minZ, maxZ } = dataStats
    const hovered = hoveredInfo?.name ?? null

    setCapColor({ fn: (feat: object) => {
      const f    = feat as CountryFeature
      const name = geoKey(f.properties)
      if (hovered && name === hovered) return 'rgba(255,255,255,0.92)'
      const total = medals[name] ?? 0
      if (total === 0) return 'rgba(60,60,60,0.5)'
      return medalColor(Math.sqrt(total) / Math.sqrt(maxMedals))
    }})

    setCapColor2({ fn: (feat: object) => {
      const f    = feat as CountryFeature
      const name = geoKey(f.properties)
      if (hovered && name === hovered) return 'rgba(255,255,255,0.92)'
      const z = avgZscore[name]
      if (z == null) return 'rgba(60,60,60,0.5)'
      return medalColor((z - minZ) / (maxZ - minZ))
    }})
  }, [hoveredInfo, dataStats, medals, avgZscore])

  // ── Globe camera sync ────────────────────────────────────────────────────────
  useEffect(() => {
    const g1 = globeEl.current
    const g2 = globeEl2.current
    if (!g1?.controls || !g2?.controls) return

    g1.controls().autoRotate      = true
    g1.controls().autoRotateSpeed = 0.3
    g2.controls().autoRotate      = false

    const syncToGlobe2 = () => { g2.pointOfView(g1.pointOfView(), 0) }
    g1.controls().addEventListener('change', syncToGlobe2)

    const syncToGlobe1 = () => { g1.pointOfView(g2.pointOfView(), 0) }
    g2.controls().addEventListener('start', () => { g1.controls().autoRotate = false })
    g2.controls().addEventListener('change', syncToGlobe1)
    g2.controls().addEventListener('end',   () => { g1.controls().autoRotate = true  })

    return () => {
      g1.controls().removeEventListener('change', syncToGlobe2)
      g2.controls().removeEventListener('change', syncToGlobe1)
    }
  }, [])

  // ── Hover handler (shared between both globes) ────────────────────────────────
  const handlePolygonHover = (feat: object | null) => {
    if (!feat) { setHoveredInfo(null); return }
    const { NAME_LONG: name, ISO_A2: iso2 } = (feat as CountryFeature).properties
    setHoveredInfo({ name, iso2 })
  }

  const globeWidth = width / 2

  const baseProps = {
    width:                    globeWidth,
    height,
    backgroundColor:          '#000d1f',
    globeImageUrl:            '/GSP/earth-dark.jpg',
    polygonsData:             countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'),
    polygonAltitude:          altitude.value,
    polygonStrokeColor:       () => '#000',
    polygonSideColor:         () => 'rgba(80,80,80,0.2)',
    polygonsTransitionDuration: transitionDuration,
  }

  // Static named markers for each globe
  const globe1StaticMarkers: GlobeHtmlItem[] = GLOBE1_COUNTRIES.map(c => ({
    kind:  'static' as const,
    ...c,
    label: `${c.name} (${medals[c.key] ?? 0})`,
  }))
  const globe2StaticMarkers: GlobeHtmlItem[] = GLOBE2_COUNTRIES.map(c => {
    const z = avgZscore[c.key]
    return { kind: 'static' as const, ...c, label: `${c.name} (${z != null ? z.toFixed(2) : 'N/A'})` }
  })

  // Medal / efficiency stats for the hover overlay
  const hMedals  = hoveredInfo ? (medals[hoveredInfo.name] ?? 0)       : null
  const hZscore  = hoveredInfo ? (avgZscore[hoveredInfo.name] ?? null)  : null

  // On-country hover label items — injected into both globes when a country is hovered
  const hoverCentroid = hoveredInfo ? (centroids[hoveredInfo.name] ?? null) : null
  const globe1HtmlData: GlobeHtmlItem[] = [
    ...globe1StaticMarkers,
    ...(hoverCentroid
      ? [{ kind: 'hover' as const, lat: hoverCentroid.lat, lng: hoverCentroid.lng,
           line: `🥇 ${hMedals ?? 0} medals` }]
      : []),
  ]
  const globe2HtmlData: GlobeHtmlItem[] = [
    ...globe2StaticMarkers,
    ...(hoverCentroid && hZscore != null
      ? [{ kind: 'hover' as const, lat: hoverCentroid.lat, lng: hoverCentroid.lng,
           line: `⚡ ${hZscore >= 0 ? '+' : ''}${hZscore.toFixed(2)}σ efficiency` }]
      : []),
  ]

  // Helper callback — used by both Globe htmlElement props
  const htmlElementFactory = (d: object) => {
    const item = d as GlobeHtmlItem
    if (item.kind === 'hover') return makeHoverLabelElement(item.line)
    return makeMarkerElement(item.label)
  }

  return (
    <div
      style={{ position: 'sticky', top: 0, width, height, overflow: 'clip', background: 'var(--bg)', cursor }}
      onMouseMove={e => {
        if (draggingRef.current) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cy = height / 2
        const r1 = height * 0.32
        const r2 = height * 0.42
        const g1cx = split ? width / 4 : width / 2
        const g2cx = (3 * width) / 4
        const overG1 = Math.hypot(x - g1cx, y - cy) <= r1
        const overG2 = split && Math.hypot(x - g2cx, y - cy) <= r2
        setCursor(overG1 || overG2 ? 'grab' : 'auto')
      }}
      onMouseDown={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cy = height / 2
        const r1 = height * 0.32
        const r2 = height * 0.42
        const g1cx = split ? width / 4 : width / 2
        const g2cx = (3 * width) / 4
        const overG1 = Math.hypot(x - g1cx, y - cy) <= r1
        const overG2 = split && Math.hypot(x - g2cx, y - cy) <= r2
        if (overG1 || overG2) { draggingRef.current = true; setCursor('grabbing') }
      }}
      onMouseUp={()    => { draggingRef.current = false; setCursor('grab') }}
      onMouseLeave={()  => { draggingRef.current = false; setCursor('auto') }}
    >

      {/* ── Hover badge — bottom-centre, always visible above the fold ──────── */}
      {hoveredInfo && (
        <div style={{
          position:       'absolute',
          bottom:         56,
          left:           '50%',
          transform:      'translateX(-50%)',
          background:     'rgba(0,10,30,0.92)',
          backdropFilter: 'blur(8px)',
          border:         '1px solid rgba(255,255,255,0.22)',
          borderRadius:   10,
          padding:        '8px 22px',
          color:          '#fff',
          fontFamily:     'system-ui, sans-serif',
          zIndex:         20,
          pointerEvents:  'none',
          whiteSpace:     'nowrap',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            4,
        }}>
          {/* Country name */}
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {iso2ToFlagEmoji(hoveredInfo.iso2)} {hoveredInfo.name}
          </div>
          {/* Both metrics side by side */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 12 }}>
            <span>🥇 <b>{hMedals}</b> medals since 1960</span>
            {hZscore != null && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.28)' }}>|</span>
                <span style={{ color: hZscore >= 0 ? '#f59e0b' : '#93c5fd' }}>
                  ⚡ {hZscore >= 0 ? '+' : ''}{hZscore.toFixed(2)}σ efficiency
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Globe 1: starts centred, slides left on split ─────────────────── */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       0,
        transition: isMounted ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        transform:  split ? 'translateX(0)' : `translateX(${width / 4}px)`,
      }}>
        {/* Title + legend */}
        <div style={{
          position:      'absolute',
          top:           48,
          left:          globeWidth * 0.1,
          width:         globeWidth * 0.8,
          textAlign:     'center',
          pointerEvents: 'none',
          zIndex:        1,
        }}>
          <div style={{
            color:       'var(--text)',
            fontSize:    'var(--fs-md)',
            fontFamily:  'var(--font-sans)',
            fontWeight:  'var(--fw-semi)',
            textShadow:  '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            By raw medals — USA, China and Germany dominate.
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>Fewer</span>
            <div style={{ width: 64, height: 5, borderRadius: 3, background: MEDAL_GRADIENT }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>More medals</span>
          </div>
          {/* Insight callout */}
          <div style={{
            marginTop:  8,
            fontSize:   11,
            color:      'rgba(255,255,255,0.38)',
            fontFamily: 'system-ui, sans-serif',
            fontStyle:  'italic',
            lineHeight: 1.45,
          }}>
            The USA, Soviet Union &amp; Great Britain account for nearly 45% of all Summer medals since 1960.
          </div>
        </div>

        {/* "Scroll down" prompt — fades out on split */}
        <div style={{
          position:   'absolute',
          bottom:     24,
          left:       0,
          width:      globeWidth,
          textAlign:  'center',
          color:      'var(--text-soft)',
          fontSize:   'var(--fs-md)',
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
          zIndex:     1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          transition: 'opacity 0.4s ease',
          opacity:    split ? 0 : 1,
        }}>
          Scroll down to see how a different success metric changes the picture.
        </div>

        {/* "Drag to explore" hint */}
        <div style={{
          position:   'absolute',
          top:        '80%',
          right:      '10%',
          color:      'var(--text-soft)',
          fontSize:   'var(--fs-md)',
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
          zIndex:     1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          display:    'flex',
          alignItems: 'center',
          gap:        6,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11V6a2 2 0 1 1 4 0v5" />
            <path d="M13 8a2 2 0 1 1 4 0v4" />
            <path d="M17 10a2 2 0 1 1 3 0v5a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-3-5.2a2 2 0 0 1 3.5-2L9 13" />
          </svg>
          Drag to explore
        </div>

        <Globe
          ref={globeEl}
          {...baseProps}
          onGlobeReady={() => {
            globeEl.current.controls().enableZoom = false
            globeEl.current.pointOfView({ lat: 0, lng: -30, altitude: 2.2 }, 5000)
          }}
          polygonCapColor={capColor.fn}
          onPolygonHover={handlePolygonHover}
          polygonLabel={(feat: object) => {
            const { properties: d } = feat as CountryFeature
            const total = medals[geoKey(d)] ?? 0
            return `<div><b>${d.ADMIN}</b><br/>Total medals: <i>${total}</i></div>`
          }}
          htmlElementsData={globe1HtmlData}
          htmlLat={(d: object) => (d as { lat: number }).lat}
          htmlLng={(d: object) => (d as { lng: number }).lng}
          htmlAltitude={(d: object) => (d as GlobeHtmlItem).kind === 'hover' ? 0.08 : 0.04}
          htmlElement={htmlElementFactory}
        />
      </div>

      {/* ── Globe 2: starts off-screen right, slides in on split ──────────── */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       width / 2,
        transition: isMounted ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease' : 'none',
        transform:  split ? 'translateX(0)' : `translateX(${width / 2}px)`,
        opacity:    split ? 1 : 0,
      }}>
        {/* Title + legend */}
        <div style={{
          position:      'absolute',
          top:           48,
          left:          globeWidth * 0.1,
          width:         globeWidth * 0.8,
          textAlign:     'center',
          pointerEvents: 'none',
          zIndex:        1,
        }}>
          <div style={{
            color:      'var(--text)',
            fontSize:   'var(--fs-md)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-semi)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            Adjusted for wealth &amp; population — Kenya and Hungary rise to the top.
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>Lower</span>
            <div style={{ width: 64, height: 5, borderRadius: 3, background: MEDAL_GRADIENT }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>Higher efficiency</span>
          </div>
          {/* Insight callout */}
          <div style={{
            marginTop:  8,
            fontSize:   11,
            color:      'rgba(255,255,255,0.38)',
            fontFamily: 'system-ui, sans-serif',
            fontStyle:  'italic',
            lineHeight: 1.45,
          }}>
            Hungary wins ~4× more medals than its GDP &amp; population predict — the most efficient Summer Olympic nation on record.
          </div>
        </div>

        <Globe
          ref={globeEl2}
          {...baseProps}
          onGlobeReady={() => { globeEl2.current.controls().enableZoom = false }}
          polygonCapColor={capColor2.fn}
          onPolygonHover={handlePolygonHover}
          polygonLabel={(feat: object) => {
            const { properties: d } = feat as CountryFeature
            const z    = avgZscore[geoKey(d)]
            const zStr = z != null ? z.toFixed(2) : 'N/A'
            return `<div><b>${d.ADMIN}</b><br/>Relative performance: <i>${zStr}</i></div>`
          }}
          htmlElementsData={globe2HtmlData}
          htmlLat={(d: object) => (d as { lat: number }).lat}
          htmlLng={(d: object) => (d as { lng: number }).lng}
          htmlAltitude={(d: object) => (d as GlobeHtmlItem).kind === 'hover' ? 0.08 : 0.04}
          htmlElement={htmlElementFactory}
        />
      </div>

    </div>
  )
}
