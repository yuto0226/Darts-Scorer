import LZString from 'lz-string'
import type { GameRecord, RoundRecord } from '../stores/history'
import type { DartScore } from './darts'

// Minified Types
type MinifiedGameType = 0 | 1 | 2 // 0: '01', 1: 'cricket', 2: 'count_up'

interface MinifiedThrow {
  s: number // score
  m: 1 | 2 | 3 // multiplier
}

interface MinifiedRound {
  t: [number, 1 | 2 | 3][] // throws: [score, multiplier]
}

interface MinifiedGameRecord {
  t: MinifiedGameType // type
  ts?: number // targetScore
  d: number // date
  w: string // winner
  fs: any // finalScore
  r: MinifiedRound[] // rounds
}

// Helpers
const getTypeIndex = (type: '01' | 'cricket' | 'count_up'): MinifiedGameType => {
  switch (type) {
    case '01':
      return 0
    case 'cricket':
      return 1
    case 'count_up':
      return 2
  }
}

const getTypeString = (type: MinifiedGameType): '01' | 'cricket' | 'count_up' => {
  switch (type) {
    case 0:
      return '01'
    case 1:
      return 'cricket'
    case 2:
      return 'count_up'
  }
}

const getLabel = (score: number, multiplier: number): string => {
  if (score === 0) return 'Miss'
  if (score === 25) {
    return multiplier === 2 ? 'D-Bull' : 'Bull'
  }
  const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : ''
  return `${prefix}${score}`
}

// Main Functions
export function encodeGameRecord(record: GameRecord): string {
  const minified: MinifiedGameRecord = {
    t: getTypeIndex(record.type),
    ts: record.targetScore,
    d: record.date,
    w: record.winner,
    fs: record.finalScore,
    r: record.rounds.map((round) => ({
      t: round.throws.map((t) => [t.score, t.multiplier]),
    })),
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(minified))
}

export function decodeGameRecord(compressed: string): GameRecord {
  const json = LZString.decompressFromEncodedURIComponent(compressed)
  if (!json) throw new Error('Decompression failed')

  const minified: MinifiedGameRecord = JSON.parse(json)
  const type = getTypeString(minified.t)

  // Reconstruct Rounds and Calculate Stats
  const rounds: RoundRecord[] = []
  let currentScore01 = minified.ts || 301
  let currentScoreCountUp = 0
  const cricketMarks: Record<number, number> = {
    15: 0,
    16: 0,
    17: 0,
    18: 0,
    19: 0,
    20: 0,
    25: 0,
  }
  let cricketScore = 0
  let totalDarts = 0
  let totalMarks = 0 // For MPR

  minified.r.forEach((mr, index) => {
    const throws: DartScore[] = mr.t.map(([s, m]) => ({
      score: s,
      multiplier: m,
      label: getLabel(s, m),
    }))

    totalDarts += throws.length

    // Calculate Score After
    let scoreAfter: number | Record<number, number> = 0

    if (type === '01') {
      throws.forEach((t) => {
        let val = t.score * t.multiplier
        if (t.score === 25 || t.score === 50) val = 50
        currentScore01 -= val
      })
      // Simple reconstruction (doesn't handle bust logic perfectly if we don't have history,
      // but for display purposes, the final result of the round is what matters.
      // However, we don't store per-throw history in minified, just per-round.
      // Assuming the stored rounds are valid played rounds.)
      scoreAfter = currentScore01
    } else if (type === 'count_up') {
      throws.forEach((t) => {
        let val = t.score * t.multiplier
        if (t.score === 25 || t.score === 50) val = 50
        currentScoreCountUp += val
      })
      scoreAfter = currentScoreCountUp
    } else if (type === 'cricket') {
      // Replaying cricket logic is hard without opponent state.
      // But for stats (MPR), we just need marks.
      // For scoreAfter, we might just return the marks count?
      // The original RoundRecord for cricket has scoreAfter as Record<number, number> (marks)
      // We can try to accumulate marks.
      throws.forEach((t) => {
        const target = t.score
        if (cricketMarks[target] !== undefined) {
          totalMarks += t.multiplier
          cricketMarks[target] += t.multiplier
        }
      })
      scoreAfter = { ...cricketMarks }
    }

    rounds.push({
      round: index + 1,
      throws,
      scoreAfter,
    })
  })

  // Calculate Stats
  const stats: { ppd?: number; ppr?: number; mpr?: number } = {}

  if (type === '01' && minified.ts) {
    // PPD = (Start - End) / Darts
    // If game finished, End is 0. If not, End is finalScore.
    // Actually minified.fs should be the final score.
    const effectivePoints = minified.ts - (minified.fs as number)
    if (totalDarts > 0) {
      stats.ppd = Number((effectivePoints / totalDarts).toFixed(2))
      stats.ppr = Number((stats.ppd * 3).toFixed(2))
    }
  } else if (type === 'count_up') {
    const totalScore = minified.fs as number
    if (totalDarts > 0) {
      stats.ppd = Number((totalScore / totalDarts).toFixed(2))
      stats.ppr = Number((stats.ppd * 3).toFixed(2))
    }
  } else if (type === 'cricket') {
    const roundsPlayed = totalDarts / 3
    if (roundsPlayed > 0) {
      stats.mpr = Number((totalMarks / roundsPlayed).toFixed(2))
    }
  }

  return {
    id: 'shared-' + minified.d, // Generate a temp ID
    type,
    targetScore: minified.ts,
    date: minified.d,
    winner: minified.w,
    finalScore: minified.fs,
    rounds,
    stats,
  }
}
