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

export default function GlobeSection({ width, height, split }: GlobeSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(undefined!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl2 = useRef<any>(undefined!)
  const [countries, setCountries] = useState<CountriesData>({ features: [] })
  const [medals, setMedals] = useState<Record<string, number>>({})
  const [efficiency, setEfficiency] = useState<Record<string, number>>({})
  const [altitude, setAltitude] = useState<{ value: number | ((feat: object) => number) }>({ value: 0.01 })
  const [capColor, setCapColor] = useState<{ fn: (feat: object) => string }>({ fn: () => 'rgba(100,100,100,0.6)' })
  const [capColor2, setCapColor2] = useState<{ fn: (feat: object) => string }>({ fn: () => 'rgba(100,100,100,0.6)' })
  const [transitionDuration, setTransitionDuration] = useState(1000)

  useEffect(() => {
    Promise.all([
      fetch('/GSP/ne_110m_admin_0_countries.geojson').then(r => r.json()),
      fetch('/GSP/efficiency_by_country.csv').then(r => r.text()),
    ]).then(([geoData, efficiencyCsv]: [CountriesData, string]) => {
      setCountries(geoData)

      const medalData: Record<string, number> = {}
      const efficiencyData: Record<string, number> = {}
      for (const line of efficiencyCsv.trim().split('\n').slice(1)) {
        const [country, effValue, medalValue] = line.split(',')
        const medals = parseInt(medalValue)
        const eff = parseFloat(effValue)
        if (country && !isNaN(medals)) medalData[country] = medals
        if (country && !isNaN(eff)) efficiencyData[country] = eff
      }
      setMedals(medalData)
      setEfficiency(efficiencyData)

      const maxMedals = Math.max(...Object.values(medalData))
      const effValues = Object.values(efficiencyData)
      const minEff = Math.min(...effValues)
      const maxEff = Math.max(...effValues)

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
          const eff = efficiencyData[geoKey(f.properties)]
          if (eff == null) return 'rgba(60,60,60,0.5)'
          return medalColor((eff - minEff) / (maxEff - minEff))
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

  return (
    <div style={{ position: 'sticky', top: 0, width, height, overflow: 'clip', background: '#000d1f' }}>
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
          left: 0,
          width: globeWidth,
          textAlign: 'center',
          color: 'white',
          fontSize: 24,
          fontFamily: 'sans-serif',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          The most successful countries at the Olympics are believed to be the US, China and Germany.
        </div>
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          width: globeWidth,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 24,
          fontFamily: 'sans-serif',
          pointerEvents: 'none',
          zIndex: 1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          transition: 'opacity 0.4s ease',
          opacity: split ? 0 : 1,
        }}>
          Scroll down to see if this is the whole story
        </div>

        <Globe
          ref={globeEl}
          {...baseProps}
          onGlobeReady={() => {
            globeEl.current.controls().enableZoom = false
            globeEl.current.pointOfView({ lat: 0, lng: -30, altitude: 4 }, 5000)
          }}
          polygonCapColor={capColor.fn}
          polygonLabel={(feat: object) => {
            const { properties: d } = feat as CountryFeature
            const total = medals[geoKey(d)] ?? 0
            return `<div><b>${d.ADMIN}</b><br/>Total medals: <i>${total}</i></div>`
          }}
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
          left: 0,
          width: globeWidth,
          textAlign: 'center',
          color: 'white',
          fontSize: 24,
          fontFamily: 'sans-serif',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 1,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          But if we look at the efficiency of countries, we see a different picture:
        </div>
        <Globe
          ref={globeEl2}
          {...baseProps}
          onGlobeReady={() => { globeEl2.current.controls().enableZoom = false }}
          polygonCapColor={capColor2.fn}
          polygonLabel={(feat: object) => {
            const { properties: d } = feat as CountryFeature
            const eff = efficiency[geoKey(d)]
            const effStr = eff != null ? eff.toFixed(3) : 'N/A'
            const total = medals[geoKey(d)] ?? 0
            return `<div><b>${d.ADMIN}</b><br/>Efficiency (inv. GDP): <i>${effStr}</i><br/>Total medals: <i>${total}</i></div>`
          }}
        />
      </div>
    </div>
  )
}
