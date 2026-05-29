import { useRef, useState, useEffect } from 'react'
import { useWindowSize } from './hooks/useWindowSize'
import HeroSection from './components/sections/HeroSection'
import KeyFindings from './components/sections/KeyFindings'
import GlobeSection from './components/GlobeSection'
import BarChartRaceSection from './components/BarChartRaceSection'
import GapminderScatter from './components/GapminderScatter'
import OurMethodology from './components/OurMethodology'

function App() {
  const { width: W, height: H } = useWindowSize()
  const [scrollY,        setScrollY]        = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const globeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y     = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollY(y)
      setScrollProgress(total > 0 ? y / total : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const aspectRatio  = W / H
  const targetRatio  = 16 / 9
  const ratioOk      = aspectRatio > targetRatio - 0.2 && aspectRatio < targetRatio + 0.6
  const globeSplit   = scrollY > (globeRef.current?.offsetTop ?? 0) + 200

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ── Vertical scroll progress bar ────────────────────────────────── */}
      <div style={{
        position:      'fixed',
        right:         20,
        top:           0,
        bottom:        0,
        width:         7,
        zIndex:        9990,
        background:    'rgba(255,255,255,0.10)',
        pointerEvents: 'none',
        borderRadius:  4,
      }}>
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          width:      '100%',
          height:     `${scrollProgress * 100}%`,
          background: 'linear-gradient(180deg, #3b82f6 0%, #7c3aed 45%, #f59e0b 100%)',
          transition: 'height 0.1s linear',
          boxShadow:  '0 0 10px 2px rgba(124,58,237,0.55)',
        }}>
          {/* Glowing pulse dot at the tip */}
          {scrollProgress > 0.01 && (
            <div className="scroll-progress-dot" style={{
              position:     'absolute',
              bottom:       -6,
              left:         '50%',
              transform:    'translateX(-50%)',
              width:        12,
              height:       12,
              borderRadius: '50%',
              background:   '#f59e0b',
            }} />
          )}
        </div>
      </div>

      {/* ── Aspect-ratio warning overlay ────────────────────────────────── */}
      {!ratioOk && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
        }}>
          <div style={{
            background: 'var(--bg-elev)', color: 'var(--text)', padding: '2rem',
            borderRadius: 12, maxWidth: 480, textAlign: 'center', border: '1px solid var(--border-soft)',
          }}>
            <h2 style={{ marginTop: 0 }}>Adjust your window</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              This experience is designed for a 16:9 aspect ratio. Your current
              window is {aspectRatio.toFixed(2)}:1 — please resize to roughly
              16:9 ({targetRatio.toFixed(2)}:1) for the best view.
            </p>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <HeroSection onScrollDown={() => globeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />

      {/* ── Globe ───────────────────────────────────────────────────────── */}
      {/* The inner 100vh div with overflow:hidden is required —
          it clips the WebGL canvas correctly. Do not remove it. */}
      <div ref={globeRef} style={{ height: '220vh', position: 'relative' }}>
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'sticky', top: 0 }}>
          <GlobeSection width={W} height={H} split={globeSplit} />
        </div>
      </div>

      {/* ── Our methodology ─────────────────────────────────────────────── */}
      <div style={{ padding: '3rem 2rem', color: 'var(--text)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <OurMethodology />
        </div>
      </div>

      {/* ── Gapminder scatter ───────────────────────────────────────────── */}
      <div style={{ padding: '3rem 2rem', color: 'var(--text)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <GapminderScatter />
        </div>
      </div>

      {/* ── Bar chart race ──────────────────────────────────────────────── */}
      <div style={{ height: '75vh', position: 'relative', borderTop: '1px solid var(--border-soft)' }}>
        <BarChartRaceSection width={W} height={Math.floor(H * 0.75)} />
      </div>

      {/* ── Key findings ────────────────────────────────────────────────── */}
      <div style={{ padding: '4rem 2rem', color: 'var(--text)', borderTop: '1px solid var(--border-soft)' }}>
        <KeyFindings />
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--border-soft)',
        color: 'var(--text-dim)',
        fontSize: 'var(--fs-xs)',
      }}>
        <div style={{
          maxWidth: 1060, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem',
        }}>
          <div>
            <div style={{ fontWeight: 'var(--fw-semi)', color: 'var(--text-muted)', marginBottom: 4 }}>
              Olympic Success of Countries — More Than Just Medals?
            </div>
            <div>COM-480 Data Visualisation · EPFL · 2025–2026</div>
          </div>
          <div>
            <div style={{ fontWeight: 'var(--fw-semi)', color: 'var(--text-muted)', marginBottom: 4 }}>Data sources</div>
            <div>Olympic medals: Kaggle / IOC (1896–2024)</div>
            <div>GDP &amp; population: World Bank (1960–2024)</div>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default App
