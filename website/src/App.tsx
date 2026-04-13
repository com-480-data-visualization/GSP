import { useState, useEffect } from 'react'
import GlobeSection from './GlobeSection'
import RacingBarChart from './components/RacingBarChart'

function App() {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [scrollY, setScrollY] = useState(0)
  const [season, setSeason] = useState<Season>('Summer')

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



  type Season = 'Summer' | 'Winter'

  return (
    <div style={{ height: '300vh', position: 'relative' }}>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <GlobeSection width={W} height={H} split={split} />
      </div>
      

      {/* Full-screen overlay: slides up over everything */}
      {/* Racing bar chart section — same dark background */}
      <div style={{ padding: '3rem 2rem', color: '#e2e8f0' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '1.6rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Olympic Efficiency Over Time
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Medal performance relative to GDP rank, rolling 10-year window.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {(['Summer', 'Winter'] as Season[]).map(s => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                style={{
                  padding: '0.4rem 1.2rem',
                  borderRadius: 6,
                  border: '2px solid #3b82f6',
                  background: season === s ? '#3b82f6' : 'transparent',
                  color: season === s ? '#fff' : '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {s === 'Summer' ? '☀️ Summer' : '❄️ Winter'}
              </button>
            ))}
          </div>

          <RacingBarChart key={season} season={season} />
        </div>
      </div>
    </div>  
  )}

export default App
