import type { GapminderData, Season } from '../types/olympics'
import { IOC_TO_ISO2, CANONICAL_NAME_OVERRIDES, iso2ToFlagEmoji } from './countryMaps'

export type RaceDatum = {
  name: string   // "Germany 🇩🇪" — country name with trailing flag emoji
  date: string   // "YYYY-01-01"
  value: number
}

/**
 * Transforms raw gapminder JSON into two racing-bars series:
 *  - medals:     cumulative actual medal count per country per year
 *  - efficiency: cumulative (actual / expected) ratio per country per year
 *
 * Both series use the same stable name strings so a shared colorMap applies
 * identically to both charts.
 */
export function buildRaceSeries(
  data: GapminderData,
  season: Season,
): { medals: RaceDatum[]; efficiency: RaceDatum[] } {
  const seasonData = data[season]
  const years = [...seasonData.years].sort((a, b) => a - b)

  // Resolve the canonical display name for each IOC code (use the most recent
  // name seen in the data, then apply any hard-coded overrides).
  const latestNameByCode = new Map<string, { year: number; name: string }>()
  for (const year of years) {
    for (const row of seasonData.byYear[String(year)]?.countries ?? []) {
      const existing = latestNameByCode.get(row.code)
      if (!existing || year >= existing.year) {
        latestNameByCode.set(row.code, { year, name: row.country })
      }
    }
  }

  const canonicalByCode = new Map<string, string>()
  for (const [code, latest] of latestNameByCode.entries()) {
    canonicalByCode.set(code, CANONICAL_NAME_OVERRIDES[code] ?? latest.name)
  }

  // Walk forward through years, accumulating running totals.
  const running = new Map<string, { actual: number; expected: number }>()
  const medals: RaceDatum[] = []
  const efficiency: RaceDatum[] = []

  for (const year of years) {
    // Aggregate this year's rows by country code.
    const byCode = new Map<string, { actual: number; expected: number }>()
    for (const row of seasonData.byYear[String(year)]?.countries ?? []) {
      const entry = byCode.get(row.code) ?? { actual: 0, expected: 0 }
      entry.actual   += Number(row.medal_count) || 0
      entry.expected += Number(row.predicted)   || 0
      byCode.set(row.code, entry)
    }

    // Add to running totals.
    for (const [code, values] of byCode.entries()) {
      const totals = running.get(code) ?? { actual: 0, expected: 0 }
      totals.actual   += values.actual
      totals.expected += values.expected
      running.set(code, totals)
    }

    // Emit one datum per country for this year.
    for (const [code, totals] of running.entries()) {
      const iso2 = IOC_TO_ISO2[code]
      const date = `${year}-01-01`
      const baseName = canonicalByCode.get(code) ?? code
      const name = iso2 ? `${baseName} ${iso2ToFlagEmoji(iso2)}` : baseName

      medals.push({ name, date, value: Math.round(totals.actual) })

      if (totals.expected > 0) {
        efficiency.push({
          name,
          date,
          value: Math.round((totals.actual / totals.expected) * 1000) / 1000,
        })
      }
    }
  }

  return { medals, efficiency }
}
