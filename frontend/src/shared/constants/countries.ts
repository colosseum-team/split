export interface Country {
  code: string
  name: string
  emoji: string
}

export const COUNTRIES: ReadonlyArray<Country> = [
  { code: 'US', name: 'United States', emoji: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom and Wales', emoji: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', emoji: '🇦🇪' },
  { code: 'CH', name: 'Switzerland', emoji: '🇨🇭' },
] as const

export const findCountryByCode = (code?: string) =>
  COUNTRIES.find((c) => c.code === String(code || '').toUpperCase()) || null
