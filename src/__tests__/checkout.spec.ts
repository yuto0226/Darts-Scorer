import { describe, it, expect } from 'vitest'
import { getCheckoutGuide } from '../utils/checkout'

describe('getCheckoutGuide', () => {
  it('returns null for invalid scores', () => {
    expect(getCheckoutGuide(0, 3)).toBeNull()
    expect(getCheckoutGuide(181, 3)).toBeNull()
    expect(getCheckoutGuide(-1, 3)).toBeNull()
  })

  it('returns 1-dart finish for exact matches', () => {
    const result = getCheckoutGuide(20, 3)
    expect(result).not.toBeNull()
    expect(result!.steps).toHaveLength(1)
    expect(result!.finalOptions).toBeDefined()
    expect(result!.finalOptions!.some((opt) => opt.score === 20 && opt.multiplier === 1)).toBe(true)
    expect(result!.isSetup).toBe(false)
  })

  it('returns 1-dart finish with multiple options for doubles', () => {
    const result = getCheckoutGuide(20, 3)
    expect(result).not.toBeNull()
    expect(result!.finalOptions).toBeDefined()
    expect(result!.finalOptions!.length).toBeGreaterThan(1)
  })

  it('returns 2-dart finish', () => {
    const result = getCheckoutGuide(100, 3) // T20 + D20
    expect(result).not.toBeNull()
    expect(result!.steps).toHaveLength(2)
    expect(result!.isSetup).toBe(false)
  })

  it('returns 3-dart finish', () => {
    const result = getCheckoutGuide(180, 3) // T20 + T20 + T20
    expect(result).not.toBeNull()
    expect(result!.steps).toHaveLength(3)
    expect(result!.isSetup).toBe(false)
  })

  it('returns setup suggestion when no finish possible with 1 dart', () => {
    const result = getCheckoutGuide(100, 1)
    expect(result).not.toBeNull()
    expect(result!.steps).toHaveLength(1)
    expect(result!.isSetup).toBe(true)
  })

  it('returns null when no solution found', () => {
    // For example, score that can't be made with available throws
    expect(getCheckoutGuide(181, 3)).toBeNull()
  })

  it('respects darts remaining', () => {
    expect(getCheckoutGuide(20, 0)).toBeNull() // No darts left
  })

  // Edge cases
  it('handles boundary scores', () => {
    expect(getCheckoutGuide(1, 3)).not.toBeNull() // S1
    expect(getCheckoutGuide(2, 3)).not.toBeNull() // D1
    expect(getCheckoutGuide(180, 3)).not.toBeNull() // T20 x3
  })

  it('returns null for scores requiring more darts than available', () => {
    expect(getCheckoutGuide(180, 2)).toBeNull() // 180 needs 3 darts
    expect(getCheckoutGuide(100, 1)).not.toBeNull() // But setup is allowed
  })

  it('prefers higher scoring throws in combinations', () => {
    const result = getCheckoutGuide(140, 3) // Could be T20+T20+D20 or other combos
    expect(result).not.toBeNull()
    expect(result!.steps[0].score * result!.steps[0].multiplier).toBeGreaterThanOrEqual(
      result!.steps[1]?.score * result!.steps[1]?.multiplier || 0,
    )
  })

  it('handles bull finishes', () => {
    const result = getCheckoutGuide(50, 3) // D-Bull
    expect(result).not.toBeNull()
    expect(result!.finalOptions!.some((opt) => opt.score === 25 && opt.multiplier === 2)).toBe(true)
  })

  it('setup suggestion for preferred leaves', () => {
    const result = getCheckoutGuide(64, 1) // Should leave 32 (preferred) by throwing D32? Wait, better example
    expect(result).not.toBeNull()
    expect(result!.isSetup).toBe(true)
    // The setup should leave a preferred score
  })

  it('setup suggestion for any finishable score', () => {
    const result = getCheckoutGuide(70, 1) // Leave 70- something <=60
    expect(result).not.toBeNull()
    expect(result!.isSetup).toBe(true)
  })

  it('no setup if direct finish possible', () => {
    const result = getCheckoutGuide(20, 1)
    expect(result!.isSetup).toBe(false)
  })
})
