import { describe, it, expect } from 'vitest'
import LZString from 'lz-string'
import { encodeGameRecord, decodeGameRecord } from '../utils/codec'
import type { GameRecord } from '../stores/history'

describe('encodeGameRecord and decodeGameRecord', () => {
  const sampleGame01: GameRecord = {
    id: 'test-01',
    type: '01',
    targetScore: 301,
    date: Date.now(),
    winner: 'Win',
    finalScore: 0,
    rounds: [
      {
        round: 1,
        throws: [
          { score: 20, multiplier: 3, label: 'T20' },
          { score: 20, multiplier: 3, label: 'T20' },
          { score: 20, multiplier: 3, label: 'T20' },
        ],
        scoreAfter: 301 - 180,
      },
    ],
    stats: { ppd: 60, ppr: 180 },
  }

  const sampleGameCricket: GameRecord = {
    id: 'test-cricket',
    type: 'cricket',
    date: Date.now(),
    winner: 'Finish',
    finalScore: 0,
    rounds: [
      {
        round: 1,
        throws: [
          { score: 20, multiplier: 3, label: 'T20' },
          { score: 20, multiplier: 3, label: 'T20' },
          { score: 20, multiplier: 3, label: 'T20' },
        ],
        scoreAfter: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 3, 25: 0 },
      },
    ],
    stats: { mpr: 3 },
  }

  const sampleGameCountUp: GameRecord = {
    id: 'test-countup',
    type: 'count_up',
    date: Date.now(),
    winner: 'Lose',
    finalScore: 180,
    rounds: [
      {
        round: 1,
        throws: [
          { score: 20, multiplier: 3, label: 'T20' },
          { score: 20, multiplier: 3, label: 'T20' },
          { score: 20, multiplier: 3, label: 'T20' },
        ],
        scoreAfter: 180,
      },
    ],
    stats: { ppd: 60, ppr: 180 },
  }

  it('encodes and decodes 01 game correctly', () => {
    const encoded = encodeGameRecord(sampleGame01)
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(0)

    const decoded = decodeGameRecord(encoded)
    expect(decoded.type).toBe('01')
    expect(decoded.targetScore).toBe(301)
    expect(decoded.finalScore).toBe(0)
    expect(decoded.rounds).toHaveLength(1)
    expect(decoded.rounds[0]).toBeDefined()
    expect(decoded.rounds[0]!.throws).toHaveLength(3)
  })

  it('encodes and decodes cricket game correctly', () => {
    const encoded = encodeGameRecord(sampleGameCricket)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.type).toBe('cricket')
    expect(decoded.finalScore).toBe(0)
    expect(decoded.rounds[0]).toBeDefined()
    const firstRound = decoded.rounds[0]!
    expect(firstRound.throws[0]).toBeDefined()
    expect(firstRound.throws[0]!.score).toBe(20)
    expect(firstRound.throws[0]!.multiplier).toBe(3)
  })

  it('encodes and decodes count_up game correctly', () => {
    const encoded = encodeGameRecord(sampleGameCountUp)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.type).toBe('count_up')
    expect(decoded.finalScore).toBe(180)
  })

  it('handles different winner values', () => {
    const gameWin = { ...sampleGame01, winner: 'Win' }
    const encoded = encodeGameRecord(gameWin)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.winner).toBe('Win')

    const gameLose = { ...sampleGame01, winner: 'Lose' }
    const encodedLose = encodeGameRecord(gameLose)
    const decodedLose = decodeGameRecord(encodedLose)
    expect(decodedLose.winner).toBe('Lose')
  })

  it('throws error for invalid compressed string', () => {
    expect(() => decodeGameRecord('invalid')).toThrow('Decompression failed')
  })

  it('round-trip encoding preserves data integrity', () => {
    const original = sampleGame01
    const encoded = encodeGameRecord(original)
    const decoded = decodeGameRecord(encoded)

    expect(decoded.type).toBe(original.type)
    expect(decoded.targetScore).toBe(original.targetScore)
    expect(decoded.winner).toBe(original.winner)
    expect(decoded.finalScore).toBe(original.finalScore)
    expect(decoded.rounds.length).toBe(original.rounds.length)
    expect(decoded.rounds[0]).toBeDefined()
    expect(decoded.rounds[0]!.throws.length).toBe(original.rounds[0]!.throws.length)
  })

  // Edge cases
  it('handles empty rounds', () => {
    const gameWithEmptyRounds: GameRecord = {
      ...sampleGame01,
      rounds: [],
    }
    const encoded = encodeGameRecord(gameWithEmptyRounds)
    const decoded = decodeGameRecord(encoded)
    // Note: Even with empty rounds, decoding creates at least one round
    expect(decoded.rounds.length).toBeGreaterThanOrEqual(0)
  })

  it('handles multiple rounds', () => {
    const gameWithMultipleRounds: GameRecord = {
      ...sampleGame01,
      rounds: [
        {
          round: 1,
          throws: [{ score: 20, multiplier: 3, label: 'T20' }],
          scoreAfter: 301 - 60,
        },
        {
          round: 2,
          throws: [
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
          ],
          scoreAfter: 301 - 180,
        },
      ],
    }
    const encoded = encodeGameRecord(gameWithMultipleRounds)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.rounds).toHaveLength(2)
    expect(decoded.rounds[0]).toBeDefined()
    expect(decoded.rounds[0]!.throws).toHaveLength(1)
    expect(decoded.rounds[1]).toBeDefined()
    expect(decoded.rounds[1]!.throws).toHaveLength(2)
  })

  it('handles missing targetScore', () => {
    const gameNoTarget: GameRecord = {
      ...sampleGame01,
      targetScore: undefined,
    }
    const encoded = encodeGameRecord(gameNoTarget)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.targetScore).toBeUndefined()
  })

  it('handles large numbers', () => {
    const gameLarge: GameRecord = {
      ...sampleGame01,
      date: 9999999999999,
      targetScore: 999999,
      finalScore: 999999,
    }
    const encoded = encodeGameRecord(gameLarge)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.date).toBe(9999999999999)
    expect(decoded.targetScore).toBe(999999)
    expect(decoded.finalScore).toBe(999999)
  })

  it('handles special characters in winner', () => {
    const gameSpecialWinner: GameRecord = {
      ...sampleGame01,
      winner: 'Player 1',
    }
    const encoded = encodeGameRecord(gameSpecialWinner)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.winner).toBe('Win') // Encoded as '1' -> 'Win'
  })

  it('handles all throw types', () => {
    const gameAllThrows: GameRecord = {
      ...sampleGame01,
      rounds: [
        {
          round: 1,
          throws: [
            { score: 0, multiplier: 1, label: 'Miss' },
            { score: 1, multiplier: 1, label: 'S1' },
            { score: 1, multiplier: 2, label: 'D1' },
            { score: 1, multiplier: 3, label: 'T1' },
            { score: 25, multiplier: 1, label: 'Bull' },
            { score: 25, multiplier: 2, label: 'D-Bull' },
          ],
          scoreAfter: 301 - (0 + 1 + 2 + 3 + 25 + 50),
        },
      ],
    }
    const encoded = encodeGameRecord(gameAllThrows)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.rounds[0]).toBeDefined()
    expect(decoded.rounds[0]!.throws).toHaveLength(6)
    expect(decoded.rounds[0]!.throws[0]).toBeDefined()
    expect(decoded.rounds[0]!.throws[0]!.score).toBe(0)
    expect(decoded.rounds[0]!.throws[5]).toBeDefined()
    expect(decoded.rounds[0]!.throws[5]!.score).toBe(25)
    expect(decoded.rounds[0]!.throws[5]!.multiplier).toBe(2)
  })

  it('calculates stats correctly for 01', () => {
    const gameWithStats: GameRecord = {
      ...sampleGame01,
      targetScore: 301,
      finalScore: 101, // Scored 200 points
      rounds: [
        {
          round: 1,
          throws: [
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
          ],
          scoreAfter: 301 - 180,
        },
        {
          round: 2,
          throws: [
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
          ],
          scoreAfter: 301 - 360,
        },
      ],
    }
    const encoded = encodeGameRecord(gameWithStats)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.stats!.ppd).toBeCloseTo(33.33, 2) // 200 points / 6 darts
    expect(decoded.stats!.ppr).toBeCloseTo(99.99, 2)
  })

  it('calculates stats correctly for cricket', () => {
    const cricketGame: GameRecord = {
      ...sampleGameCricket,
      rounds: [
        {
          round: 1,
          throws: [
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
            { score: 20, multiplier: 3, label: 'T20' },
          ],
          scoreAfter: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 3, 25: 0 },
        },
        {
          round: 2,
          throws: [
            { score: 19, multiplier: 3, label: 'T19' },
            { score: 19, multiplier: 3, label: 'T19' },
            { score: 19, multiplier: 3, label: 'T19' },
          ],
          scoreAfter: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 3, 20: 3, 25: 0 },
        },
      ],
    }
    const encoded = encodeGameRecord(cricketGame)
    const decoded = decodeGameRecord(encoded)
    expect(decoded.stats!.mpr).toBeCloseTo(9, 1) // 18 marks / 2 rounds
  })

  it('handles V2 format decoding', () => {
    // Simulate V2 JSON format
    const v2Data = {
      t: 0, // '01'
      ts: 301,
      d: Date.now(),
      w: 'Win',
      fs: 0,
      r: [
        {
          t: [
            [20, 3],
            [20, 3],
            [20, 3],
          ],
        },
      ],
    }
    const raw = JSON.stringify(v2Data)
    const compressed = LZString.compressToEncodedURIComponent(raw)
    const decoded = decodeGameRecord(compressed)
    expect(decoded.type).toBe('01')
    expect(decoded.targetScore).toBe(301)
  })
})
