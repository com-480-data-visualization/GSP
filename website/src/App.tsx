import { useState } from 'react'
import GlobeViz from './components/GlobeViz'
import RacingBarChart from './components/RacingBarChart'
import './App.css'

type Season = 'Summer' | 'Winter'

function App() {
  const [season, setSeason] = useState<Season>('Summer')

  return (
    <>
      {/* Globe — full viewport height */}
      <div style={{ width: '100%', height: '100vh', background: '#000011', overflow: 'hidden' }}>
        <GlobeViz />
      </div>

      {/* Racing bar chart section */}
      <div style={{ background: '#0d0d1f', color: '#e2e8f0', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ color: '#e2e8f0', marginBottom: '0.25rem' }}>
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
    </>
  )
}

export default App
