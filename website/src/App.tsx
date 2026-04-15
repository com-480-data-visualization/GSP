import { useState, useEffect, useRef } from 'react'
import GlobeSection from './GlobeSection'
import BarChartRaceSection from './components/BarChartRaceSection'

function App() {
  const [dimensions, setDimensions] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  })
  const [scrollY, setScrollY] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const W = dimensions.width
  const H = dimensions.height

  // Globe split: same threshold as original working code
  const globeSplit = scrollY > 200

  // Bar chart split: 200px after the bar section enters the page
  const barSectionTop = barRef.current?.offsetTop ?? Infinity
  const barSplit = scrollY > barSectionTop + 200

  return (
    <div style={{ background: '#000d1f' }}>

      {/* ── Globe: EXACTLY the original working structure ───────────────────
           The inner 100vh div with overflow:hidden is required — it clips
           the WebGL canvas correctly. Removing it breaks the globe layout. */}
      <div style={{ height: '200vh', position: 'relative' }}>
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
          <GlobeSection width={W} height={H} split={globeSplit} />
        </div>
      </div>

      {/* ── Bar chart race ───────────────────────────────────────────────── */}
      <div ref={barRef} style={{ height: '150vh', position: 'relative' }}>
        <BarChartRaceSection width={W} height={H} split={barSplit} />
      </div>

    </div>
  )
}

export default App
