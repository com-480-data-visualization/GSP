// ─── IOC 3-letter → ISO2 2-letter country code lookup ─────────────────────────
// Used for flag emoji generation. This is the most complete version, consolidated
// from all components that previously maintained their own copy.

export const IOC_TO_ISO2: Record<string, string> = {
  AFG: 'af', ALB: 'al', ARE: 'ae', ARG: 'ar', ARM: 'am', AUS: 'au', AUT: 'at',
  AZE: 'az', BDI: 'bi', BEL: 'be', BGR: 'bg', BHS: 'bs', BLR: 'by', BMU: 'bm',
  BRA: 'br', BFA: 'bf', BRB: 'bb', BRN: 'bn', BWA: 'bw',
  CAN: 'ca', CHE: 'ch', CHL: 'cl', CHN: 'cn', CIV: 'ci', CMR: 'cm',
  COL: 'co', CPV: 'cv', CRI: 'cr', CUB: 'cu', CYP: 'cy', CZE: 'cz',
  DEU: 'de', DJI: 'dj', DMA: 'dm', DNK: 'dk', DOM: 'do', DZA: 'dz',
  ECU: 'ec', EGY: 'eg', ERI: 'er', ESP: 'es', EST: 'ee', ETH: 'et',
  FIN: 'fi', FJI: 'fj', FRA: 'fr',
  GAB: 'ga', GBR: 'gb', GEO: 'ge', GHA: 'gh', GRC: 'gr', GRD: 'gd', GTM: 'gt', GUY: 'gy',
  HKG: 'hk', HRV: 'hr', HUN: 'hu',
  IDN: 'id', IND: 'in', IRL: 'ie', IRN: 'ir', IRQ: 'iq', ISL: 'is', ISR: 'il', ITA: 'it',
  JAM: 'jm', JOR: 'jo', JPN: 'jp',
  KAZ: 'kz', KEN: 'ke', KGZ: 'kg', KOR: 'kr', KWT: 'kw',
  LCA: 'lc', LIE: 'li', LKA: 'lk', LTU: 'lt', LUX: 'lu', LVA: 'lv',
  MAR: 'ma', MDA: 'md', MEX: 'mx', MKD: 'mk', MNE: 'me', MNG: 'mn', MOZ: 'mz', MUS: 'mu', MYS: 'my',
  NAM: 'na', NER: 'ne', NGA: 'ng', NLD: 'nl', NOR: 'no', NZL: 'nz',
  PAK: 'pk', PAN: 'pa', PER: 'pe', PHL: 'ph', POL: 'pl', PRI: 'pr', PRT: 'pt', PRY: 'py',
  QAT: 'qa', ROU: 'ro', RUS: 'ru',
  SAU: 'sa', SDN: 'sd', SEN: 'sn', SGP: 'sg', SMR: 'sm', SRB: 'rs', SUR: 'sr',
  SVK: 'sk', SVN: 'si', SWE: 'se', SYR: 'sy',
  TGO: 'tg', THA: 'th', TJK: 'tj', TKM: 'tm', TON: 'to', TTO: 'tt', TUN: 'tn', TUR: 'tr', TZA: 'tz',
  UGA: 'ug', UKR: 'ua', URY: 'uy', USA: 'us', UZB: 'uz',
  VEN: 've', VNM: 'vn',
  WSM: 'ws', XKX: 'xk',
  ZAF: 'za', ZMB: 'zm', ZWE: 'zw',
}

// ─── Canonical display-name overrides (IOC code → preferred name) ──────────────
// Fixes cases where historical names appear in older data rows.

export const CANONICAL_NAME_OVERRIDES: Record<string, string> = {
  DEU: 'Germany',
  RUS: 'Russian Federation',
  SRB: 'Serbia',
  CZE: 'Czech Republic',
}

// ─── Flag emoji helpers ────────────────────────────────────────────────────────

/** ISO2 code → flag emoji (e.g. 'us' → '🇺🇸') */
export function iso2ToFlagEmoji(iso2: string): string {
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 0x1F1A5))
    .join('')
}

/** IOC code → flag emoji (e.g. 'USA' → '🇺🇸'). Returns 🏳 if code is unknown. */
export function iocToFlagEmoji(ioc: string): string {
  const iso2 = IOC_TO_ISO2[ioc]
  return iso2 ? iso2ToFlagEmoji(iso2) : '🏳'
}
