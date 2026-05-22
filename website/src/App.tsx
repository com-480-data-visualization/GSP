import { useState, useEffect, useRef } from 'react'
import GlobeSection from './GlobeSection'
import BarChartRaceSection from './components/BarChartRaceSection'
import GapminderScatter from './components/GapminderScatter'
import OurMethodology from './components/OurMethodology'

function App() {
  const [dimensions, setDimensions] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  })
  const [scrollY, setScrollY] = useState(0)
  const globeRef = useRef<HTMLDivElement>(null)

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

  const aspectRatio = W / H
  const targetRatio = 16 / 9
  const ratioOk = aspectRatio > targetRatio - 0.2 && aspectRatio < targetRatio + 0.6

  // Globe split: 200px after the globe section enters the page
  const globeSectionTop = globeRef.current?.offsetTop ?? 0
  const globeSplit = scrollY > globeSectionTop + 200

  return (
    <div style={{ background: 'var(--bg)' }}>

      {!ratioOk && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-elev)',
              color: 'var(--text)',
              padding: '2rem',
              borderRadius: 12,
              maxWidth: 480,
              textAlign: 'center',
              border: '1px solid var(--border-soft)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Adjust your window</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              This experience is designed for a 16:9 aspect ratio. Your current
              window is {aspectRatio.toFixed(2)}:1 — please resize to roughly
              16:9 ({targetRatio.toFixed(2)}:1) for the best view.
            </p>
          </div>
        </div>
      )}

      {/* ── Intro hero ───────────────────────────────────────────────────── */}
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 2rem',
          color: 'var(--text)',
          background:
            'radial-gradient(ellipse at center, var(--bg-elev) 0%, var(--bg) 70%)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--fs-display)',
            fontWeight: 'var(--fw-bold)',
            lineHeight: 'var(--lh-tight)',
            margin: 0,
            maxWidth: '18ch',
            background: 'linear-gradient(90deg, var(--gold) 0%, #ffffff 50%, var(--accent-soft) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Olympic success of countries — more than just medals?
        </h1>
        <p
          style={{
            marginTop: '1.5rem',
            fontSize: 'var(--fs-md)',
            maxWidth: '60ch',
            color: 'var(--text-muted)',
          }}
        >
          Standard medal counts don't tell the full story. Let's explore how factors like population and wealth influence Olympic success, and see which countries truly punch above their weight.
        </p>
        <button
          type="button"
          onClick={() =>
            globeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          style={{
            marginTop: '3rem',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-dim)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Explore ↓
        </button>
      </div>

      {/* ── Globe: EXACTLY the original working structure ───────────────────
           The inner 100vh div with overflow:hidden is required — it clips
           the WebGL canvas correctly. Removing it breaks the globe layout. */}
      <div ref={globeRef} style={{ height: '150vh', position: 'relative' }}>
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'sticky', top: 0 }}>
          <GlobeSection width={W} height={H} split={globeSplit} />
        </div>
      </div>

      {/* ── Our methodology ──────────────────────────────────────────────── */}
      <div style={{ padding: '3rem 2rem', color: 'var(--text)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <OurMethodology />
        </div>
      </div>

        {/* ── Gapminder scatter ────────────────────────────────────────────── */}
      <div style={{ padding: '3rem 2rem', color: 'var(--text)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <GapminderScatter />
        </div>
      </div>


      {/* ── Bar chart race ───────────────────────────────────────────────── */}
      <div style={{ height: '100vh', paddingTop: '3rem', position: 'relative', borderTop: '1px solid var(--border-soft)' }}>
        <BarChartRaceSection width={W} height={H} />
      </div>

      {/* ── Key findings ─────────────────────────────────────────────────── */}
      <div style={{ padding: '4rem 2rem', color: 'var(--text)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'var(--fs-xl)',
              fontWeight: 'var(--fw-bold)',
              lineHeight: 'var(--lh-tight)',
              margin: 0,
              background:
                'linear-gradient(90deg, var(--gold) 0%, #ffffff 60%, var(--accent-soft) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Key findings
          </h2>
          <p
            style={{
              marginTop: '1rem',
              fontSize: 'var(--fs-md)',
              maxWidth: '70ch',
              color: 'var(--text-muted)',
              lineHeight: 'var(--lh-relaxed)',
            }}
          >
            Looking past raw medal counts and adjusting for population and GDP
            per capita reshuffles the leaderboard — and tells a richer story of
            Olympic success.
          </p>

          <div
            style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--border-soft)',
                borderRadius: 12,
                padding: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>
                Medal counts favor the big and rich
              </h3>
              <p
                style={{
                  marginTop: '0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-sm)',
                  lineHeight: 'var(--lh-relaxed)',
                }}
              >
                Population and GDP per capita together explain a large share of
                a country's medal haul — confirming that absolute totals mostly
                track size and wealth.
              </p>
            </div>
            <div
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--border-soft)',
                borderRadius: 12,
                padding: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>
                Small nations punch above their weight
              </h3>
              <p
                style={{
                  marginTop: '0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-sm)',
                  lineHeight: 'var(--lh-relaxed)',
                }}
              >
                Once we control for resources, several smaller countries
                consistently exceed expectations, while a few large economies
                fall well below the regression line.
              </p>
            </div>
            <div
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--border-soft)',
                borderRadius: 12,
                padding: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>
                The leaderboard shifts over time
              </h3>
              <p
                style={{
                  marginTop: '0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-sm)',
                  lineHeight: 'var(--lh-relaxed)',
                }}
              >
                The bar chart race highlights how geopolitical shifts, host
                advantages, and targeted investment in sport repeatedly reshape
                who tops the rankings.
              </p>
            </div>
          </div>

          <p
            style={{
              marginTop: '2.5rem',
              fontSize: 'var(--fs-md)',
              maxWidth: '70ch',
              color: 'var(--text-muted)',
              lineHeight: 'var(--lh-relaxed)',
            }}
          >
            Olympic success is more than just medals: it is what a country
            achieves <em>relative</em> to what its size and resources would
            predict. Through that lens, the Games become a fairer contest — and
            a more interesting one.
          </p>
        </div>
      </div>

    </div>
  )
}

export default App
