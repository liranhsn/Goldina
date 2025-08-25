import { describe, it, expect } from 'vitest'
import { ensurePositiveGrams } from '../electron/main/domain.js'

describe('domain guards', () => {
  it('ensures positive grams with <=3 dp', () => {
    expect(() => ensurePositiveGrams(1)).not.toThrow()
    expect(() => ensurePositiveGrams(1.123)).not.toThrow()
    expect(() => ensurePositiveGrams(0)).toThrow()
    expect(() => ensurePositiveGrams(-1)).toThrow()
    expect(() => ensurePositiveGrams(1.1234)).toThrow()
  })
})
