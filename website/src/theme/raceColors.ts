// ─── Color configuration for the bar chart race ───────────────────────────────

/**
 * Highlighted "story" countries get a distinct accent color.
 * Keys must match the canonical base name (without the trailing flag emoji).
 */
export const STORY_COLORS: Record<string, string> = {
  'Hungary':            '#F5C542',
  'Russian Federation': '#E07272',
  'Ukraine':            '#72A8E0',
}

/** Soft jewel-tone palette for all other countries. */
export const SOFT_PALETTE = [
  '#7EB5C4', '#8FBF8F', '#C4A8B8', '#C4B082',
  '#B0C47E', '#C49080', '#7EC4A0', '#A87EC4',
  '#C4A07E', '#9EB4C4', '#C4BC7E', '#7EC4B8',
]

/**
 * Builds a stable { name → color } map suitable for racing-bars' `colorMap` option.
 *
 * Names are sorted alphabetically before palette assignment so the same country
 * always gets the same color regardless of which season or year is active.
 * Story countries are always assigned their designated accent color.
 *
 * Name format expected: "Germany 🇩🇪" (base name + space + trailing flag emoji).
 */
export function buildColorMap(names: string[]): Record<string, string> {
  const sorted = [...names].sort()
  let paletteIdx = 0
  const map: Record<string, string> = {}

  for (const name of sorted) {
    // Strip the trailing flag emoji to get the plain base name for lookup.
    const base = name.replace(/\s[\u{1F1E0}-\u{1F1FF}]{2}$/u, '').trim()
    map[name] = STORY_COLORS[base] ?? SOFT_PALETTE[paletteIdx++ % SOFT_PALETTE.length]
  }

  return map
}
