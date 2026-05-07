export interface Currency {
  code: string
  name: string
  emoji?: string
  symbol?: string
}

export const CURRENCIES: ReadonlyArray<Currency> = [
  { code: 'SOL', name: 'Solana', symbol: 'SOL' },
  { code: 'USDC', name: 'USD Coin', symbol: 'USDC' },
  { code: 'USD', name: 'American Dollar', emoji: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', emoji: '🇪🇺', symbol: '€' },
] as const

export const findCurrencyByCode = (code?: string) =>
  CURRENCIES.find((c) => c.code === String(code || '').toUpperCase()) || null
