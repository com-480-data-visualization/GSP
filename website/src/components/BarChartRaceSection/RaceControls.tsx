import React from 'react'

interface Props {
  allDates:       string[]
  dateIdx:        number
  playing:        boolean
  sliderRef:      React.RefObject<HTMLInputElement | null>
  onSkipToStart:  () => void
  onTogglePlay:   () => void
  onSkipToEnd:    () => void
  onSliderChange: (idx: number) => void
}

const btnStyle: React.CSSProperties = {
  padding:    '0.25rem 0.6rem',
  borderRadius: 6,
  border:     '2px solid var(--accent)',
  background: 'transparent',
  color:      'var(--accent)',
  fontFamily: 'var(--font-sans)',
  cursor:     'pointer',
  fontSize:   'var(--fs-sm)',
}

export default function RaceControls({
  allDates,
  dateIdx,
  playing,
  sliderRef,
  onSkipToStart,
  onTogglePlay,
  onSkipToEnd,
  onSliderChange,
}: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

      <button onClick={onSkipToStart} style={btnStyle} title="Skip to start">⏮</button>

      <button
        onClick={onTogglePlay}
        style={{ ...btnStyle, minWidth: 36 }}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      <button onClick={onSkipToEnd} style={btnStyle} title="Skip to end">⏭</button>

      <span style={{
        color:      'var(--text)',
        fontWeight: 'var(--fw-semi)',
        fontSize:   'var(--fs-md)',
        minWidth:   42,
        textAlign:  'center',
      }}>
        {allDates[dateIdx]?.slice(0, 4) ?? ''}
      </span>

      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={Math.max(0, allDates.length - 1)}
        defaultValue={0}
        onChange={e => onSliderChange(Number(e.target.value))}
        style={{ width: 300, maxWidth: '50vw' }}
      />

    </div>
  )
}
