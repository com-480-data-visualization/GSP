interface Props {
  onScrollDown: () => void
}

export default function HeroSection({ onScrollDown }: Props) {
  return (
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
        background: 'radial-gradient(ellipse at center, var(--bg-elev) 0%, var(--bg) 70%)',
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
        Standard medal counts don't tell the full story. Let's explore how factors
        like population and wealth influence Olympic success, and see which countries
        truly punch above their weight.
      </p>
      <button
        type="button"
        onClick={onScrollDown}
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
  )
}
