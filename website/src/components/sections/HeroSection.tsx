interface Props {
  onScrollDown: () => void
}

export default function HeroSection({ onScrollDown }: Props) {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 2rem',
        color: 'var(--text)',
        background: 'radial-gradient(ellipse at center, var(--bg-elev) 0%, var(--bg) 70%)',
        overflow: 'hidden',
      }}
    >
      {/* Olympic rings watermark */}
      <svg
        viewBox="0 0 240 155"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          right: '-8%',
          top: '-10%',
          width: '55%',
          opacity: 0.07,
          pointerEvents: 'none',
        }}
      >
        <circle cx="60" cy="55" r="46" fill="none" stroke="#0081C8" strokeWidth="11" />
        <circle cx="120" cy="55" r="46" fill="none" stroke="#ffffff" strokeWidth="11" />
        <circle cx="180" cy="55" r="46" fill="none" stroke="#CE2B37" strokeWidth="11" />
        <circle cx="90" cy="100" r="46" fill="none" stroke="#D4A017" strokeWidth="11" />
        <circle cx="150" cy="100" r="46" fill="none" stroke="#009646" strokeWidth="11" />
      </svg>

      <h1
        style={{
          fontSize: 'var(--fs-display)',
          fontWeight: 'var(--fw-bold)',
          lineHeight: 'var(--lh-tight)',
          margin: 0,
          maxWidth: '16ch',
          background: 'linear-gradient(90deg, var(--gold) 0%, #ffffff 50%, var(--accent-soft) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Who really wins the Olympics?
      </h1>
      <p
        style={{
          marginTop: '1.5rem',
          fontSize: 'var(--fs-md)',
          maxWidth: '55ch',
          color: 'var(--text-muted)',
          lineHeight: 'var(--lh-relaxed)',
        }}
      >
        Raw medal counts reward the big and the wealthy. We adjust for population
        and GDP to reveal which countries truly punch above their weight.
      </p>
      <button
        type="button"
        onClick={onScrollDown}
        style={{
          marginTop: '2.5rem',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-soft)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '0.5rem 1.5rem',
          cursor: 'pointer',
          font: 'inherit',
          transition: 'border-color 0.2s, color 0.2s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-muted)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)'
        }}
      >
        Explore ↓
      </button>
    </div>
  )
}
