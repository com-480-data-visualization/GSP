// ─── Shared data types for the gapminder_scatter.json dataset ─────────────────

export type Season = 'Summer' | 'Winter'

export interface OlympicCountryRecord {
  country: string
  code: string
  medal_count: number
  predicted: number
  gdp_per_capita: number
  population: number   // millions
  ratio: number        // actual / expected — >1 means over-performing
  zscore: number
}

export interface YearData {
  countries: OlympicCountryRecord[]
  curve?: [number, number][]  // [[gdp_per_capita, predicted_medals], ...] at median population
}

export interface SeasonData {
  years: number[]
  byYear: Record<string, YearData>
}

export interface GapminderData {
  meta: { gdpMin: number; gdpMax: number; ratioMax: number }
  Summer: SeasonData
  Winter: SeasonData
}
