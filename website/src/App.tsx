import { useState, useEffect } from 'react'
import GlobeSection from './GlobeSection'

function App() {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
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
  const split = scrollY > 200
  const showGreen = scrollY > 793

  return (
    <div style={{ height: '300vh', position: 'relative' }}>
      <GlobeSection width={W} height={H} split={split} />

      {/* Full-screen overlay: slides up over everything */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000010',
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: showGreen ? 'translateY(0)' : 'translateY(100vh)',
        pointerEvents: showGreen ? 'auto' : 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
      }}>
        {['Bar chart race', 'Efficiency plot', 'Sport-specific plot'].map(title => (
          <div key={title} style={{ color: 'white', fontSize: 36, fontFamily: 'sans-serif', fontWeight: 600 }}>
            {title}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
