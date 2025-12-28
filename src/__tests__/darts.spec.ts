import { describe, it, expect } from 'vitest'
import { getScoreFromCoordinates } from '../utils/darts'

describe('getScoreFromCoordinates', () => {
  it('returns D-Bull for inner bull', () => {
    const result = getScoreFromCoordinates(0, 0)
    expect(result.score).toBe(50)
    expect(result.multiplier).toBe(1)
    expect(result.label).toBe('D-Bull')
  })

  it('returns S-Bull for outer bull', () => {
    const result = getScoreFromCoordinates(10, 0) // Between R_BULL_INNER=6 and R_BULL_OUTER=15
    expect(result.score).toBe(25)
    expect(result.multiplier).toBe(1)
    expect(result.label).toBe('S-Bull')
  })

  it('returns Miss for outside double ring', () => {
    const result = getScoreFromCoordinates(101, 0) // Beyond R_DOUBLE_OUTER = 100
    expect(result.score).toBe(0)
    expect(result.multiplier).toBe(1)
    expect(result.label).toBe('Miss')
  })

  it('returns Double 20 at top', () => {
    // Top: y negative, x=0
    const result = getScoreFromCoordinates(0, -95) // Within double ring
    expect(result.score).toBe(20)
    expect(result.multiplier).toBe(2)
    expect(result.label).toBe('D20')
  })

  it('returns Triple 20 at top', () => {
    const result = getScoreFromCoordinates(0, -60) // Within triple ring
    expect(result.score).toBe(20)
    expect(result.multiplier).toBe(3)
    expect(result.label).toBe('T20')
  })

  it('returns Single 20 at top', () => {
    const result = getScoreFromCoordinates(0, -40) // Inner single
    expect(result.score).toBe(20)
    expect(result.multiplier).toBe(1)
    expect(result.label).toBe('S20')
    expect(result.isInner).toBe(true)
  })

  it('returns correct scores for different angles', () => {
    // 3 o'clock: x positive, y=0 -> slice 6
    const result3 = getScoreFromCoordinates(95, 0)
    expect(result3.score).toBe(6)
    expect(result3.multiplier).toBe(2)
    expect(result3.label).toBe('D6')

    // 6 o'clock: x=0, y positive -> slice 3
    const result6 = getScoreFromCoordinates(0, 95)
    expect(result6.score).toBe(3)
    expect(result6.multiplier).toBe(2)
    expect(result6.label).toBe('D3')

    // 9 o'clock: x negative, y=0 -> slice 11
    const result9 = getScoreFromCoordinates(-95, 0)
    expect(result9.score).toBe(11)
    expect(result9.multiplier).toBe(2)
    expect(result9.label).toBe('D11')
  })

  it('handles edge cases at slice boundaries', () => {
    // Test near slice boundaries
    const result = getScoreFromCoordinates(1, -95) // Slightly off center
    expect(result.score).toBeGreaterThan(0)
    expect([1, 5, 12, 18, 20].includes(result.score)).toBe(true) // Adjacent slices
  })

  // Edge cases
  it('handles exact boundary radii', () => {
    // Inner bull boundary
    const innerBull = getScoreFromCoordinates(6, 0) // Exactly R_BULL_INNER
    expect(innerBull.score).toBe(50)

    // Outer bull boundary
    const outerBull = getScoreFromCoordinates(15, 0) // Exactly R_BULL_OUTER
    expect(outerBull.score).toBe(25)

    // Triple inner boundary
    const tripleInner = getScoreFromCoordinates(55, 0) // Exactly R_TRIPLE_INNER
    expect(tripleInner.multiplier).toBe(3)

    // Triple outer boundary
    const tripleOuter = getScoreFromCoordinates(66, 0) // Just outside R_TRIPLE_OUTER
    expect(tripleOuter.multiplier).toBe(1)

    // Double inner boundary
    const doubleInner = getScoreFromCoordinates(90, 0) // Exactly R_DOUBLE_INNER
    expect(doubleInner.multiplier).toBe(2)

    // Double outer boundary
    const doubleOuter = getScoreFromCoordinates(101, 0) // Just outside R_DOUBLE_OUTER
    expect(doubleOuter.score).toBe(0) // Miss
  })

  it('handles negative coordinates', () => {
    const result = getScoreFromCoordinates(-95, -95)
    expect(result.score).toBe(0) // Outside ring
    expect(result.label).toBe('Miss')
  })

  it('handles all slice angles', () => {
    const slices = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
    for (let i = 0; i < slices.length; i++) {
      // Slice centers: 20 at -90 deg, then clockwise every 18 deg
      const angleDeg = -90 + i * 18
      const angle = (angleDeg * Math.PI) / 180
      const x = Math.cos(angle) * 95
      const y = Math.sin(angle) * 95
      const result = getScoreFromCoordinates(x, y)
      expect(result.score).toBe(slices[i])
      expect(result.multiplier).toBe(2)
    }
  })

  it('handles extreme coordinates', () => {
    const farOut = getScoreFromCoordinates(1000, 1000)
    expect(farOut.score).toBe(0)
    expect(farOut.label).toBe('Miss')

    const farIn = getScoreFromCoordinates(0.1, 0.1)
    expect(farIn.score).toBe(50)
  })

  it('correctly identifies inner area', () => {
    const inner = getScoreFromCoordinates(0, -30) // Inner single
    expect(inner.isInner).toBe(true)

    const outer = getScoreFromCoordinates(0, -70) // Outer single
    expect(outer.isInner).toBe(false)
  })

  it('handles bull at different positions', () => {
    // Bull at different angles should still be bull
    const bull1 = getScoreFromCoordinates(10, 10)
    expect(bull1.score).toBe(25)

    const bull2 = getScoreFromCoordinates(-10, -10)
    expect(bull2.score).toBe(25)

    const innerBull = getScoreFromCoordinates(3, 0) // Within inner bull
    expect(innerBull.score).toBe(50)
  })

  it('handles zero coordinates', () => {
    const zero = getScoreFromCoordinates(0, 0)
    expect(zero.score).toBe(50)
    expect(zero.label).toBe('D-Bull')
  })

  it('validates all possible scores', () => {
    // Test all possible scores that can be hit
    const possibleScores = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 50,
    ]
    // This is more of a sanity check - we can't test all coordinates
    const testCoords = [
      [101, 0], // Miss
      [95, 0], // D6
      [60, 0], // T6
      [40, 0], // S6
      [10, 0], // Bull
      [5, 0], // Inner bull
    ]

    testCoords.forEach((coord) => {
      const [x, y] = coord as [number, number]
      const result = getScoreFromCoordinates(x, y)
      expect(possibleScores).toContain(result.score)
    })
  })
})
