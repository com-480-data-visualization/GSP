interface Props {
  /** The maximum efficiency value in the dataset (used to compute x position). */
  maxEfficiency: number
  /** Pixel width of the efficiency chart panel. */
  chartWidth: number
}

/**
 * A dashed vertical line overlaid on the efficiency chart at the "expected"
 * baseline (ratio = 1, i.e. actual medals == predicted medals).
 *
 * Position formula derived from racing-bars' internal scale:
 *   x(v) = (v / maxValue) * (containerWidth - marginRight - valueColumnWidth)
 * with racing-bars defaults: marginRight = 20, valueColumnWidth = 65.
 */
export default function ReferenceLine({ maxEfficiency, chartWidth }: Props) {
  if (maxEfficiency <= 0) return null

  const xPos = Math.round((1 / maxEfficiency) * (chartWidth - 85))

  return (
    <div
      style={{
        position:      'absolute',
        left:          xPos,
        top:           90,   // below racing-bars' title area (~55px title + 15px gap + 20px buffer)
        bottom:        20,
        width:         0,
        borderLeft:    '2px dashed rgba(255,255,255,0.3)',
        pointerEvents: 'none',
        zIndex:        5,
      }}
    >
      <span
        style={{
          position:        'absolute',
          bottom:          4,
          left:            5,
          fontSize:        10,
          color:           'rgba(255,255,255,0.45)',
          whiteSpace:      'nowrap',
          writingMode:     'vertical-rl',
          textOrientation: 'mixed',
        }}
      >
        expected
      </span>
    </div>
  )
}
