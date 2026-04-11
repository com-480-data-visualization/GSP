import { useRef, useState, useEffect } from 'react'
import Globe from 'react-globe.gl'

interface GeoFeature {
  properties: {
    ISO_A3: string
    ADM0_A3: string
    ISO_A2: string
    ADMIN: string
  }
}

function getISO_A3(properties: GeoFeature['properties']): string {
  return properties.ISO_A3 === '-99' ? properties.ADM0_A3 : properties.ISO_A3
}

function medalCountToColor(t: number): string {
  let r: number, g: number
  if (t < 0.5) {
    const i = t / 0.5
    r = 255; g = Math.round(220 - i * 120)
  } else {
    const i = (t - 0.5) / 0.5
    r = Math.round(255 - i * 95); g = Math.round(100 - i * 100)
  }
  return `rgba(${r},${g},0,0.85)`
}

export default function GlobeViz() {
  const globeEl = useRef<any>(null)
  const [geojson, setGeojson] = useState<{ features: GeoFeature[] }>({ features: [] })
  const [medals, setMedals] = useState<Record<string, number>>({})
  const [polygonAltitude, setPolygonAltitude] = useState<((f: GeoFeature) => number) | number>(0.01)
  const [polygonColor, setPolygonColor] = useState<{ fn: (f: GeoFeature) => string }>({
    fn: () => 'rgba(100,100,100,0.6)',
  })
  const [transitionDuration, setTransitionDuration] = useState(1000)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/GSP/ne_110m_admin_0_countries.geojson').then(r => r.json()),
      fetch('/GSP/medal_totals.json').then(r => r.json()),
    ]).then(([geo, totals]: [{ features: GeoFeature[] }, Record<string, number>]) => {
      setGeojson(geo)
      setMedals(totals)
      const maxMedals = Math.max(...Object.values(totals))
      setTimeout(() => {
        setTransitionDuration(2000)
        setPolygonAltitude(() => (f: GeoFeature) => {
          const n = totals[getISO_A3(f.properties)] ?? 0
          return Math.max(0.005, Math.sqrt(n) * 0.0015)
        })
        setPolygonColor({
          fn: (f: GeoFeature) => {
            const n = totals[getISO_A3(f.properties)] ?? 0
            return n === 0
              ? 'rgba(60,60,60,0.5)'
              : medalCountToColor(Math.sqrt(n) / Math.sqrt(maxMedals))
          },
        })
      }, 3000)
    })
  }, [])

  useEffect(() => {
    if (!globeEl.current) return
    globeEl.current.controls().autoRotate = true
    globeEl.current.controls().autoRotateSpeed = 0.3
    globeEl.current.pointOfView({ altitude: 4 }, 5000)
  }, [])

  return (
    <Globe
      ref={globeEl}
      width={dimensions.width}
      height={dimensions.height}
      globeImageUrl="/GSP/earth-dark.jpg"
      polygonsData={geojson.features.filter(f => f.properties.ISO_A2 !== 'AQ')}
      polygonAltitude={polygonAltitude as any}
      polygonStrokeColor={() => '#000'}
      polygonCapColor={polygonColor.fn as any}
      polygonSideColor={() => 'rgba(80,80,80,0.2)'}
      polygonLabel={(f: any) => {
        const props = f.properties
        const n = medals[getISO_A3(props)] ?? 0
        return `<div><div><b>${props.ADMIN}</b></div><div>Total medals: <i>${n}</i></div></div>`
      }}
      polygonsTransitionDuration={transitionDuration}
    />
  )
}
