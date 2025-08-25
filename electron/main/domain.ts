import type { Metal } from './types.js'

export function ensurePositiveGrams(grams: number) {
  if (!Number.isFinite(grams) || grams <= 0) throw new Error('Grams must be > 0')
  if (Math.round(grams * 1000) !== grams * 1000) {
    throw new Error('Grams must have at most 3 decimals')
  }
}

export function toMetalTypeInt(metal: Metal) {
  return metal === 'gold' ? 1 : 2
}
