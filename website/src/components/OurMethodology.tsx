import { useEffect, useLayoutEffect, useRef, useState } from 'react'

function OurMethodology() {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelCardRef = useRef<HTMLDivElement>(null)
  const [geom, setGeom] = useState({
    containerW: 0,
    cardLeft: 0,
    cardRight: 0,
  })

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const card = modelCardRef.current
      if (!container || !card) return
      const cRect = container.getBoundingClientRect()
      const mRect = card.getBoundingClientRect()
      setGeom({
        containerW: cRect.width,
        cardLeft: mRect.left - cRect.left,
        cardRight: mRect.right - cRect.left,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Funnel geometry — flares from the Model card to the full content row,
  // enclosing both the explanation text (left) and the regression viz (right).
  const curveH = 120                // height of the curved transition
  const bodyH = 240                 // height of the content row inside the funnel
  const totalH = curveH + bodyH
  const W = geom.containerW || 1
  const cardL = geom.cardLeft
  const cardR = geom.cardRight
  const colGap = 32

  // Curves from card bottom edges out to the container edges, then straight down.
  const leftPath =
    `M ${cardL} 0 ` +
    `C ${cardL} ${curveH * 0.65}, 0 ${curveH * 0.35}, 0 ${curveH} ` +
    `L 0 ${totalH}`
  const rightPath =
    `M ${cardR} 0 ` +
    `C ${cardR} ${curveH * 0.65}, ${W} ${curveH * 0.35}, ${W} ${curveH} ` +
    `L ${W} ${totalH}`
  const fillPath =
    `M ${cardL} 0 ` +
    `C ${cardL} ${curveH * 0.65}, 0 ${curveH * 0.35}, 0 ${curveH} ` +
    `L 0 ${totalH} ` +
    `L ${W} ${totalH} ` +
    `L ${W} ${curveH} ` +
    `C ${W} ${curveH * 0.35}, ${cardR} ${curveH * 0.65}, ${cardR} 0 Z`

  return (
    <section ref={containerRef} style={{ color: 'var(--text)', position: 'relative' }}>
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
        Our methodology
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
        Raw medal counts favor large, wealthy nations. To compare countries
        fairly, we model the medals a country is <em>expected</em> to win as a
        function of its population and GDP per capita, then measure how each
        country's actual performance compares to that expectation.
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
          <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>1. Data</h3>
          <p
            style={{
              marginTop: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            Olympic medal results from 1960 onward, joined with World Bank
            population and GDP per capita for every participating country.
          </p>
        </div>
        <div
          ref={modelCardRef}
          style={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--border-soft)',
            borderRadius: 12,
            padding: '1.25rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>2. Model</h3>
          <p
            style={{
              marginTop: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            A log-linear regression predicts expected medals from population and
            GDP per capita, fit separately for Summer and Winter Games.
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
            3. Relative performance
          </h3>
          <p
            style={{
              marginTop: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            The ratio of actual to expected medals reveals whether a nation outperforms or underperforms
            the prediction.
          </p>
        </div>
      </div>

      {/* ── Funnel from the Model card enclosing the explanation + viz ───── */}
      <div style={{ position: 'relative', width: '100%', marginTop: -24 }}>
        <svg
          width="100%"
          height={totalH}
          viewBox={`0 0 ${W} ${totalH}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id="funnel-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bg-elev)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--bg-elev)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#funnel-fill)" />
          <path
            d={leftPath}
            fill="none"
            stroke="var(--border-soft)"
            strokeWidth={1}
          />
          <path
            d={rightPath}
            fill="none"
            stroke="var(--border-soft)"
            strokeWidth={1}
          />
        </svg>

        {/* Content sits inside the funnel, below the curved transition */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: colGap,
            paddingTop: curveH,
            minHeight: bodyH,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              padding: '1.5rem 1.5rem 1.5rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              textAlign: 'right',
              color: 'var(--text)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 'var(--fs-md)',
                lineHeight: 'var(--lh-relaxed)',
                color: 'var(--text-muted)',
                maxWidth: '40ch',
              }}
            >
              For each Olympic event, a regression plane is fit to all countries' medal count using the population and GDP at that time as input. Doing this per event controls for differences in population and GDP.
            </p>
          </div>
          <div
            style={{
              padding: '0 1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <RegressionViz />
          </div>
        </div>
      </div>
    </section>
  )
}

function RegressionViz() {
  const [angle, setAngle] = useState(0.5)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const elapsed = (t - start) / 1000
      setAngle(0.5 + elapsed * 0.45)
      setProgress(Math.min(1, elapsed / 1.6))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const W = 640
  const H = 400
  const ox = W * 0.5
  const oy = H * 0.68
  const scale = 110
  const tilt = Math.PI / 5
  const sinT = Math.sin(tilt)
  const cosT = Math.cos(tilt)
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  function project(x: number, y: number, z: number) {
    const xr = x * cosA - y * sinA
    const yr = x * sinA + y * cosA
    return {
      sx: ox + xr * scale,
      sy: oy - z * cosT * scale - yr * sinT * scale,
    }
  }

  const L = 1.15
  const O = project(0, 0, 0)
  const X = project(L, 0, 0)
  const Y = project(0, L, 0)
  const Z = project(0, 0, L)

  // Floor grid
  const steps = 5
  const grid: { a: { sx: number; sy: number }; b: { sx: number; sy: number } }[] = []
  for (let i = 0; i <= steps; i++) {
    const f = (i / steps) * L
    grid.push({ a: project(f, 0, 0), b: project(f, L, 0) })
    grid.push({ a: project(0, f, 0), b: project(L, f, 0) })
  }

  // Regression plane: medals = a*x + b*y, sweeping in with progress
  const aCoef = 0.65
  const bCoef = 0.55
  const p = Math.max(0.001, progress) * L
  const planeCorners = [
    project(0, 0, 0),
    project(p, 0, aCoef * p),
    project(p, p, aCoef * p + bCoef * p),
    project(0, p, bCoef * p),
  ]
  const planePath =
    `M ${planeCorners[0].sx} ${planeCorners[0].sy} ` +
    planeCorners.slice(1).map(c => `L ${c.sx} ${c.sy}`).join(' ') +
    ' Z'

  // Sample data points (x = population, y = gdp, z = actual medals)
  const points = [
    { x: 0.30, y: 0.40, z: 0.55 },
    { x: 0.80, y: 0.70, z: 1.05 },
    { x: 0.50, y: 0.90, z: 0.65 },
    { x: 0.20, y: 0.15, z: 0.30 },
    { x: 0.95, y: 0.35, z: 0.80 },
    { x: 0.60, y: 0.55, z: 0.95 },
    { x: 0.40, y: 0.25, z: 0.20 },
    { x: 0.75, y: 0.85, z: 1.10 },
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxHeight: 360, marginTop: -40, display: 'block' }}
    >
      {/* Floor grid */}
      {grid.map((g, i) => (
        <line
          key={i}
          x1={g.a.sx}
          y1={g.a.sy}
          x2={g.b.sx}
          y2={g.b.sy}
          stroke="var(--border-soft)"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      <line x1={O.sx} y1={O.sy} x2={X.sx} y2={X.sy} stroke="var(--gold)" strokeWidth={2} />
      <line x1={O.sx} y1={O.sy} x2={Y.sx} y2={Y.sy} stroke="#7ecbff" strokeWidth={2} />
      <line x1={O.sx} y1={O.sy} x2={Z.sx} y2={Z.sy} stroke="#ffffff" strokeWidth={2} />

      {/* Arrowheads */}
      {[
        { tip: X, color: 'var(--gold)' },
        { tip: Y, color: '#7ecbff' },
        { tip: Z, color: '#ffffff' },
      ].map((a, i) => {
        const dx = a.tip.sx - O.sx
        const dy = a.tip.sy - O.sy
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        const px = -uy
        const py = ux
        const headLen = 14
        const headW = 7
        const baseX = a.tip.sx - ux * headLen
        const baseY = a.tip.sy - uy * headLen
        const d =
          `M ${a.tip.sx} ${a.tip.sy} ` +
          `L ${baseX + px * headW} ${baseY + py * headW} ` +
          `L ${baseX - px * headW} ${baseY - py * headW} Z`
        return <path key={i} d={d} fill={a.color} />
      })}

      {/* Labels */}
      <text x={X.sx + 10} y={X.sy + 6} fill="var(--gold)" fontSize="24" fontWeight="600">
        Population
      </text>
      <text x={Y.sx + 10} y={Y.sy + 6} fill="#7ecbff" fontSize="24" fontWeight="600">
        GDP per capita
      </text>
      <text x={Z.sx} y={Z.sy - 12} fill="#ffffff" fontSize="24" fontWeight="600" textAnchor="middle">
        Medals
      </text>

      {/* Regression plane */}
      <path
        d={planePath}
        fill="var(--gold)"
        fillOpacity={0.18}
        stroke="var(--gold)"
        strokeOpacity={0.75}
        strokeWidth={1}
      />

      {/* Sample data points */}
      {points.map((pt, i) => {
        const sp = project(pt.x, pt.y, pt.z)
        return (
          <g key={i} opacity={progress}>
            <circle cx={sp.sx} cy={sp.sy} r={3.5} fill="#ffffff" />
            {/* drop line to floor */}
            {(() => {
              const floor = project(pt.x, pt.y, 0)
              return (
                <line
                  x1={sp.sx}
                  y1={sp.sy}
                  x2={floor.sx}
                  y2={floor.sy}
                  stroke="#ffffff"
                  strokeOpacity={0.25}
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              )
            })()}
          </g>
        )
      })}
    </svg>
  )
}

export default OurMethodology
