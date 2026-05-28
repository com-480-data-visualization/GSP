import { useState, useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'

interface CountryProperties {
  ADMIN: string
  ISO_A2: string
  ISO_A3: string
  ADM0_A3: string
  NAME_LONG: string
}

interface CountryFeature {
  properties: CountryProperties
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

const GLOBE1_COUNTRIES: CountryMarker[] = [
  { name: 'US', key: 'United States', lat: 43, lng: -98.6 },
  { name: 'China', key: 'China', lat: 38, lng: 105.0 },
  { name: 'Germany', key: 'Germany', lat: 53, lng: 10.5 },
]

const GLOBE2_COUNTRIES: CountryMarker[] = [
  { name: 'Kenya', key: 'Kenya', lat: 3, lng: 37.9 },
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
    'display: flex',
    'flex-direction: column',
    'align-items: center',
    'gap: 3px',
  ].join(';')
  el.innerHTML = `
    <div style="background:rgba(0,0,0,0.72);color:#fff;font-family:system-ui,sans-serif;font-size:11px;font-weight:600;white-space:nowrap;padding:3px 8px;border-radius:10px;line-height:1.4;border:1px solid rgba(255,255,255,0.25)">${label}</div>
    <div style="width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.8)"></div>
  `
  return el
}

export default function GlobeSection({ width, height, split }: GlobeSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(undefined!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl2 = useRef<any>(undefined!)
  const [cursor, setCursor] = useState<'grab' | 'grabbing' | 'auto'>('auto')
  const draggingRef = useRef(false)
  const [countries, setCountries] = useState<CountriesData>({ features: [] })
  const [medals, setMedals] = useState<Record<string, number>>({})
  const [avgZscore, setAvgZscore] = useState<Record<string, number>>({})
  const [altitude, setAltitude] = useState<{ value: number | ((feat: object) => number) }>({ value: 0.01 })
  const [capColor, setCapColor] = useState<{ fn: (feat: object) => string }>({ fn: () => 'rgba(100,100,100,0.6)' })
  const [capColor2, setCapColor2] = useState<{ fn: (feat: object) => string }>({ fn: () => 'rgba(100,100,100,0.6)' })
  const [transitionDuration, setTransitionDuration] = useState(1000)

  useEffect(() => {
    Promise.all([
      fetch('/GSP/ne_110m_admin_0_countries.geojson').then(r => r.json()),
      fetch('/GSP/efficiency_by_country.csv').then(r => r.text()),
      fetch('/GSP/data/gapminder_scatter.json').then(r => r.json()),
    ]).then(([geoData, efficiencyCsv, gapminderData]: [CountriesData, string, { Summer: { byYear: Record<string, { countries: { country: string; zscore: number }[] }> } }]) => {
      setCountries(geoData)

      const medalData: Record<string, number> = {}
      for (const line of efficiencyCsv.trim().split('\n').slice(1)) {
        const [country, , medalValue] = line.split(',')
        const m = parseInt(medalValue)
        if (country && !isNaN(m)) medalData[country] = m
      }
      setMedals(medalData)

      // Compute average zscore per country across all Summer years
      const zscoreSum: Record<string, number> = {}
      const zscoreCount: Record<string, number> = {}
      for (const yearData of Object.values(gapminderData.Summer.byYear)) {
        for (const { country, zscore } of yearData.countries) {
          zscoreSum[country] = (zscoreSum[country] ?? 0) + zscore
          zscoreCount[country] = (zscoreCount[country] ?? 0) + 1
        }
      }
      const zscoreData: Record<string, number> = {}
      for (const country of Object.keys(zscoreSum)) {
        zscoreData[country] = zscoreSum[country] / zscoreCount[country]
      }
      setAvgZscore(zscoreData)

      const maxMedals = Math.max(...Object.values(medalData))
      const zValues = Object.values(zscoreData)
      const minZ = Math.min(...zValues)
      const maxZ = Math.max(...zValues)

      setTimeout(() => {
        setTransitionDuration(2000)
        setAltitude({ value: (feat: object) => {
          const f = feat as CountryFeature
          const total = medalData[geoKey(f.properties)] ?? 0
          return Math.max(0.005, Math.sqrt(total) * 1.5e-3)
        }})
        setCapColor({ fn: (feat: object) => {
          const f = feat as CountryFeature
          const total = medalData[geoKey(f.properties)] ?? 0
          if (total === 0) return 'rgba(60,60,60,0.5)'
          return medalColor(Math.sqrt(total) / Math.sqrt(maxMedals))
        }})
        setCapColor2({ fn: (feat: object) => {
          const f = feat as CountryFeature
          const z = zscoreData[geoKey(f.properties)]
          if (z == null) return 'rgba(60,60,60,0.5)'
          return medalColor((z - minZ) / (maxZ - minZ))
        }})
      }, 1000)
    })
  }, [])

  useEffect(() => {
    const g1 = globeEl.current
    const g2 = globeEl2.current
    if (!g1?.controls || !g2?.controls) return

    // Only globe1 auto-rotates; globe2 follows via sync
    g1.controls().autoRotate = true
    g1.controls().autoRotateSpeed = 0.3
    g2.controls().autoRotate = false

    // Sync globe1 → globe2 on every camera change
    const syncToGlobe2 = () => {
      const pov = g1.pointOfView()
      g2.pointOfView(pov, 0)
    }
    g1.controls().addEventListener('change', syncToGlobe2)

    // Allow globe2 to be dragged and mirror back to globe1
    const syncToGlobe1 = () => {
      const pov = g2.pointOfView()
      g1.pointOfView(pov, 0)
    }
    g2.controls().addEventListener('start', () => {
      g1.controls().autoRotate = false
    })
    g2.controls().addEventListener('change', syncToGlobe1)
    g2.controls().addEventListener('end', () => {
      g1.controls().autoRotate = true
    })

    return () => {
      g1.controls().removeEventListener('change', syncToGlobe2)
      g2.controls().removeEventListener('change', syncToGlobe1)
    }
  }, [])

  const globeWidth = width / 2

  const baseProps = {
    width: globeWidth,
    height,
    backgroundColor: '#000d1f',
    globeImageUrl: '/GSP/earth-dark.jpg',
    polygonsData: countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'),
    polygonAltitude: altitude.value,
    polygonStrokeColor: () => '#000',
    polygonSideColor: () => 'rgba(80,80,80,0.2)',
    polygonsTransitionDuration: transitionDuration,
  }

  const globe1Markers = GLOBE1_COUNTRIES.map(c => ({
    ...c,
    label: `${c.name} (${medals[c.key] ?? 0})`,
  }))
  const globe2Markers = GLOBE2_COUNTRIES.map(c => {
    const z = avgZscore[c.key]
    return { ...c, label: `${c.name} (${z != null ? z.toFixed(2) : 'N/A'})` }
  })

  return (
    <div
      style={{ position: 'sticky', top: 0, width, height, overflow: 'clip', background: 'var(--bg)', cursor }}
      onMouseMove={e => {
        if (draggingRef.current) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cy = height / 2
        // Approximate globe radius in pixels (depends on camera altitude).
        // Globe1 sits at altitude 4 → smaller; Globe2 at default ~2.5 → larger.
        const r1 = height * 0.32
        const r2 = height * 0.42
        // Globe centers shift based on split state.
        const g1cx = split ? width / 4 : width / 2
        const g2cx = (3 * width) / 4
        const d1 = Math.hypot(x - g1cx, y - cy)
        const overG1 = d1 <= r1
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
        if (overG1 || overG2) {
          draggingRef.current = true
          setCursor('grabbing')
        }
      }}
      onMouseUp={() => {
        draggingRef.current = false
        setCursor('grab')
      }}
      onMouseLeave={() => {
        draggingRef.current = false
        setCursor('auto')
      }}
    >
      {/* Globe 1: starts centred, slides left on split */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: split ? 'translateX(0)' : `translateX(${width / 4}px)`,
      }}>
        <div style={{
          position: 'absolute',
          top: 48,
          left: globeWidth * 0.1,
          width: globeWidth * 0.8,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <div style={{
            color: 'var(--text)',
            fontSize: 'var(--fs-md)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-semi)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            By raw medals — USA, China and Germany dominate.
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>Fewer</span>
            <div style={{ width: 64, height: 5, borderRadius: 3, background: MEDAL_GRADIENT }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>More medals</span>
          </div>
        </div>
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          width: globeWidth,
          textAlign: 'center',
          color: 'var(--text-soft)',
          fontSize: 'var(--fs-md)',
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
          zIndex: 1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          transition: 'opacity 0.4s ease',
          opacity: split ? 0 : 1,
        }}>
          Scroll down to see how a different success metric changes the picture.
        </div>
        <div style={{
          position: 'absolute',
          top: '80%',
          right: '10%',
          color: 'var(--text-soft)',
          fontSize: 'var(--fs-md)',
          fontFamily: 'var(--font-sans)',
          pointerEvents: 'none',
          zIndex: 1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          polygonLabel={(feat: object) => {
            const { properties: d } = feat as CountryFeature
            const total = medals[geoKey(d)] ?? 0
            return `<div><b>${d.ADMIN}</b><br/>Total medals: <i>${total}</i></div>`
          }}
          htmlElementsData={globe1Markers}
          htmlLat={(d: object) => (d as { lat: number }).lat}
          htmlLng={(d: object) => (d as { lng: number }).lng}
          htmlAltitude={0.04}
          htmlElement={(d: object) => makeMarkerElement((d as { label: string }).label)}
        />
      </div>

      {/* Globe 2: starts off-screen right, slides in on split */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: width / 2,
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease',
        transform: split ? 'translateX(0)' : `translateX(${width / 2}px)`,
        opacity: split ? 1 : 0,
      }}>
        <div style={{
          position: 'absolute',
          top: 48,
          left: globeWidth * 0.1,
          width: globeWidth * 0.8,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <div style={{
            color: 'var(--text)',
            fontSize: 'var(--fs-md)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-semi)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            Adjusted for wealth &amp; population — Kenya and Hungary rise to the top.
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>Lower</span>
            <div style={{ width: 64, height: 5, borderRadius: 3, background: MEDAL_GRADIENT }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>Higher efficiency</span>
          </div>
        </div>
        <Globe
          ref={globeEl2}
          {...baseProps}
          onGlobeReady={() => { globeEl2.current.controls().enableZoom = false }}
          polygonCapColor={capColor2.fn}
          polygonLabel={(feat: object) => {
            const { properties: d } = feat as CountryFeature
            const z = avgZscore[geoKey(d)]
            const zStr = z != null ? z.toFixed(2) : 'N/A'
            return `<div><b>${d.ADMIN}</b><br/>Relative performance: <i>${zStr}</i></div>`
          }}
          htmlElementsData={globe2Markers}
          htmlLat={(d: object) => (d as { lat: number }).lat}
          htmlLng={(d: object) => (d as { lng: number }).lng}
          htmlAltitude={0.04}
          htmlElement={(d: object) => makeMarkerElement((d as { label: string }).label)}
        />
      </div>
    </div>
  )
}
