const FINDINGS = [
  {
    title: 'Medals track wealth and population',
    body:  'The USA, China and Russia dominate raw counts largely because their size and GDP give them a vast pool of athletes and resources — the medal table measures economic might as much as athletic merit.',
  },
  {
    title: 'Some nations punch far above their weight',
    body:  'Kenya, Hungary and Cuba consistently win far more medals than their GDP per capita predicts — sometimes by a factor of 5× or more. Controlling for resources reshuffles the table completely.',
  },
  {
    title: 'Efficiency rewrites Olympic history',
    body:  'In the cumulative bar chart race the USA leads total medals by a wide margin, yet Kenya and Hungary top the efficiency ranking. Nations that do more with less write a different story.',
  },
]

export default function KeyFindings() {
  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>
      <h2
        style={{
          fontSize: 'var(--fs-xl)',
          fontWeight: 'var(--fw-bold)',
          lineHeight: 'var(--lh-tight)',
          margin: 0,
          background: 'linear-gradient(90deg, var(--gold) 0%, #ffffff 60%, var(--accent-soft) 100%)',
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
        Looking past raw medal counts and adjusting for population and GDP per
        capita reshuffles the leaderboard and tells a richer story of Olympic
        success.
      </p>

      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {FINDINGS.map(({ title, body }) => (
          <div
            key={title}
            style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--border-soft)',
              borderRadius: 12,
              padding: '1.25rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>{title}</h3>
            <p
              style={{
                marginTop: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: 'var(--fs-sm)',
                lineHeight: 'var(--lh-relaxed)',
              }}
            >
              {body}
            </p>
          </div>
        ))}
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
        Olympic success is more than just medals: it is what a country achieves{' '}
        <em>relative</em> to what its size and resources would predict. Through
        that lens, the Games become a fairer contest and a more interesting one.
      </p>
    </div>
  )
}
