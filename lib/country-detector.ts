/**
 * Country Detection and Organization Utilities
 */

export interface CountryInfo {
  code: string // ISO code like "IL", "US", "UK"
  name: string // Full name like "Israel", "United States"
  flag: string // Emoji flag
}

// Country keywords for detection
const COUNTRY_PATTERNS: Record<string, CountryInfo> = {
  // Middle East
  IL: { code: "IL", name: "Israel", flag: "🇮🇱" },
  PS: { code: "PS", name: "Palestine", flag: "🇵🇸" },
  LB: { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  JO: { code: "JO", name: "Jordan", flag: "🇯🇴" },
  SY: { code: "SY", name: "Syria", flag: "🇸🇾" },
  IQ: { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  SA: { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  AE: { code: "AE", name: "UAE", flag: "🇦🇪" },
  EG: { code: "EG", name: "Egypt", flag: "🇪🇬" },
  
  // Europe
  UK: { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  FR: { code: "FR", name: "France", flag: "🇫🇷" },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪" },
  IT: { code: "IT", name: "Italy", flag: "🇮🇹" },
  ES: { code: "ES", name: "Spain", flag: "🇪🇸" },
  PT: { code: "PT", name: "Portugal", flag: "🇵🇹" },
  NL: { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  BE: { code: "BE", name: "Belgium", flag: "🇧🇪" },
  GR: { code: "GR", name: "Greece", flag: "🇬🇷" },
  TR: { code: "TR", name: "Turkey", flag: "🇹🇷" },
  
  // Americas
  US: { code: "US", name: "United States", flag: "🇺🇸" },
  CA: { code: "CA", name: "Canada", flag: "🇨🇦" },
  MX: { code: "MX", name: "Mexico", flag: "🇲🇽" },
  BR: { code: "BR", name: "Brazil", flag: "🇧🇷" },
  AR: { code: "AR", name: "Argentina", flag: "🇦🇷" },
  
  // Asia
  IN: { code: "IN", name: "India", flag: "🇮🇳" },
  CN: { code: "CN", name: "China", flag: "🇨🇳" },
  JP: { code: "JP", name: "Japan", flag: "🇯🇵" },
  KR: { code: "KR", name: "South Korea", flag: "🇰🇷" },
  PK: { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  
  // Other
  AU: { code: "AU", name: "Australia", flag: "🇦🇺" },
  RU: { code: "RU", name: "Russia", flag: "🇷🇺" },
}

// Keywords for each country
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  IL: ["israel", "israeli", "hebrew", "עברית", "ישראל", "il", "isr"],
  PS: ["palestine", "palestinian", "فلسطين", "ps"],
  LB: ["lebanon", "lebanese", "لبنان", "lb"],
  JO: ["jordan", "jordanian", "الأردن", "jo"],
  SY: ["syria", "syrian", "سوريا", "sy"],
  IQ: ["iraq", "iraqi", "العراق", "iq"],
  SA: ["saudi", "السعودية", "ksa", "sa"],
  AE: ["uae", "emirates", "الإمارات", "dubai", "ae"],
  EG: ["egypt", "egyptian", "مصر", "eg"],
  
  UK: ["uk", "united kingdom", "british", "england", "gb"],
  FR: ["france", "french", "français", "fr"],
  DE: ["germany", "german", "deutsch", "de"],
  IT: ["italy", "italian", "italiano", "it"],
  ES: ["spain", "spanish", "español", "es"],
  PT: ["portugal", "portuguese", "pt"],
  NL: ["netherlands", "dutch", "nl"],
  BE: ["belgium", "belgian", "be"],
  GR: ["greece", "greek", "gr"],
  TR: ["turkey", "turkish", "türk", "tr"],
  
  US: ["usa", "us", "united states", "american", "america"],
  CA: ["canada", "canadian", "ca"],
  MX: ["mexico", "mexican", "mx"],
  BR: ["brazil", "brazilian", "br", "brasil"],
  AR: ["argentina", "argentinian", "ar"],
  
  IN: ["india", "indian", "in"],
  CN: ["china", "chinese", "中国", "cn"],
  JP: ["japan", "japanese", "日本", "jp"],
  KR: ["korea", "korean", "한국", "kr"],
  PK: ["pakistan", "pakistani", "pk"],
  
  AU: ["australia", "australian", "aussie", "au"],
  RU: ["russia", "russian", "русский", "ru"],
}

/**
 * Detect country from channel name or group
 */
export function detectCountry(channelName: string, group?: string): CountryInfo | null {
  const searchText = `${channelName} ${group || ""}`.toLowerCase()
  
  // Check each country's keywords
  for (const [countryCode, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return COUNTRY_PATTERNS[countryCode]
      }
    }
  }
  
  return null
}

/**
 * Get country info by code
 */
export function getCountryInfo(code: string): CountryInfo | null {
  return COUNTRY_PATTERNS[code.toUpperCase()] || null
}

/**
 * Get all available countries
 */
export function getAllCountries(): CountryInfo[] {
  return Object.values(COUNTRY_PATTERNS)
}

/**
 * Group channels by country
 */
export function groupChannelsByCountry<T extends { name: string; group?: string }>(
  channels: T[]
): Record<string, { country: CountryInfo; channels: T[] }> {
  const grouped: Record<string, { country: CountryInfo; channels: T[] }> = {}
  const uncategorized: T[] = []
  
  for (const channel of channels) {
    const country = detectCountry(channel.name, channel.group)
    
    if (country) {
      if (!grouped[country.code]) {
        grouped[country.code] = {
          country,
          channels: [],
        }
      }
      grouped[country.code].channels.push(channel)
    } else {
      uncategorized.push(channel)
    }
  }
  
  // Add uncategorized if any
  if (uncategorized.length > 0) {
    grouped["OTHER"] = {
      country: { code: "OTHER", name: "Other", flag: "🌍" },
      channels: uncategorized,
    }
  }
  
  return grouped
}

/**
 * Sort countries alphabetically but keep certain ones at top
 */
export function sortCountries(
  grouped: Record<string, { country: CountryInfo; channels: any[] }>,
  priorityCountries: string[] = ["IL", "US", "UK"]
): Array<{ country: CountryInfo; channels: any[] }> {
  const entries = Object.entries(grouped)
  
  const priority: Array<{ country: CountryInfo; channels: any[] }> = []
  const regular: Array<{ country: CountryInfo; channels: any[] }> = []
  const other: { country: CountryInfo; channels: any[] } | null = null
  
  for (const [code, data] of entries) {
    if (code === "OTHER") {
      continue // Handle separately
    } else if (priorityCountries.includes(code)) {
      priority.push(data)
    } else {
      regular.push(data)
    }
  }
  
  // Sort priority by priority order
  priority.sort((a, b) => {
    const aIndex = priorityCountries.indexOf(a.country.code)
    const bIndex = priorityCountries.indexOf(b.country.code)
    return aIndex - bIndex
  })
  
  // Sort regular alphabetically
  regular.sort((a, b) => a.country.name.localeCompare(b.country.name))
  
  // Combine: priority first, then regular, then other
  const result = [...priority, ...regular]
  if (grouped["OTHER"]) {
    result.push(grouped["OTHER"])
  }
  
  return result
}
