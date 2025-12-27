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

// V3 Custom Encoding Helpers
const V3_PREFIX = 'v3|'
const ROUND_SEPARATOR_CHAR = String.fromCharCode(999)
const THROW_OFFSET = 1000

const encodeThrow = (score: number, multiplier: number): string => {
  // score 0-25, multiplier 1-3
  // val = score * 3 + (multiplier - 1)
  // max = 25 * 3 + 2 = 77
  const val = score * 3 + (multiplier - 1)
  return String.fromCharCode(THROW_OFFSET + val)
}

const decodeThrow = (char: string): { score: number; multiplier: 1 | 2 | 3 } => {
  const val = char.charCodeAt(0) - THROW_OFFSET
  const multiplier = ((val % 3) + 1) as 1 | 2 | 3
  const score = Math.floor(val / 3)
  return { score, multiplier }
}

const encodeWinner = (w: string): string => {
  if (w === 'Win' || w === 'Player 1') return '1'
  if (w === 'Lose') return '0'
  if (w === 'Finish') return '2'
  return '0'
}

const decodeWinner = (code: string): string => {
  if (code === '1') return 'Win'
  if (code === '2') return 'Finish'
  return 'Lose'
}

// Main Functions
export function encodeGameRecord(record: GameRecord): string {
  // V3 Encoding
  const typeIdx = getTypeIndex(record.type)
  const target = record.targetScore ? record.targetScore.toString(36) : ''
  const date = record.date.toString(36)
  const winner = encodeWinner(record.winner)
  const final = record.finalScore.toString(36)

  let body = ''
  record.rounds.forEach((r, i) => {
    if (i > 0) body += ROUND_SEPARATOR_CHAR
    r.throws.forEach((t) => {
      body += encodeThrow(t.score, t.multiplier)
    })
  })

  const raw = `${V3_PREFIX}${typeIdx}|${target}|${date}|${winner}|${final}|${body}`
  return LZString.compressToEncodedURIComponent(raw)
}

export function decodeGameRecord(compressed: string): GameRecord {
  const raw = LZString.decompressFromEncodedURIComponent(compressed)
  if (!raw) throw new Error('Decompression failed')

  let type: '01' | 'cricket' | 'count_up'
  let targetScore: number | undefined
  let date: number
  let winner: string
  let finalScore: any
  let roundsData: { score: number; multiplier: 1 | 2 | 3 }[][] = []

  if (raw.startsWith(V3_PREFIX)) {
    // V3 Decoding
    const parts = raw.split('|')
    // v3 | type | target | date | winner | final | body
    // 0    1      2        3      4        5       6
    const typeIdx = parseInt(parts[1] || '0') as MinifiedGameType
    type = getTypeString(typeIdx)
    targetScore = parts[2] ? parseInt(parts[2], 36) : undefined
    date = parseInt(parts[3] || '0', 36)
    winner = decodeWinner(parts[4] || '0')
    finalScore = parseInt(parts[5] || '0', 36)

    const body = parts.slice(6).join('|') // In case body contains | (it shouldn't)
    const roundStrings = body.split(ROUND_SEPARATOR_CHAR)
    roundsData = roundStrings.map((rs) => {
      const throws: { score: number; multiplier: 1 | 2 | 3 }[] = []
      for (const char of rs) {
        throws.push(decodeThrow(char))
      }
      return throws
    })
  } else {
    // V2 (JSON) Decoding
    const minified: MinifiedGameRecord = JSON.parse(raw)
    type = getTypeString(minified.t)
    targetScore = minified.ts
    date = minified.d
    winner = minified.w
    finalScore = minified.fs
    roundsData = minified.r.map((mr) =>
      mr.t.map(([s, m]) => ({ score: s, multiplier: m as 1 | 2 | 3 })),
    )
  }

  // Reconstruct Rounds and Calculate Stats
  const rounds: RoundRecord[] = []
  let currentScore01 = targetScore || 301
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

  roundsData.forEach((rd, index) => {
    const throws: DartScore[] = rd.map((t) => ({
      score: t.score,
      multiplier: t.multiplier,
      label: getLabel(t.score, t.multiplier),
    }))

    totalDarts += throws.length

    // Calculate Score After
    let scoreAfter: number | Record<number, number> = 0

    if (type === '01') {
      const startScore = currentScore01
      let isBust = false
      throws.forEach((t) => {
        if (isBust) return
        let val = t.score * t.multiplier
        if (t.score === 25 || t.score === 50) val = 50
        const newScore = currentScore01 - val
        if (newScore < 0) {
          isBust = true
        } else {
          currentScore01 = newScore
        }
      })
      if (isBust) currentScore01 = startScore
      scoreAfter = currentScore01
    } else if (type === 'count_up') {
      throws.forEach((t) => {
        let val = t.score * t.multiplier
        if (t.score === 25 || t.score === 50) val = 50
        currentScoreCountUp += val
      })
      scoreAfter = currentScoreCountUp
    } else if (type === 'cricket') {
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

  if (type === '01' && targetScore) {
    // PPD = (Start - End) / Darts
    const effectivePoints = targetScore - (finalScore as number)
    if (totalDarts > 0) {
      stats.ppd = Number((effectivePoints / totalDarts).toFixed(2))
      stats.ppr = Number((stats.ppd * 3).toFixed(2))
    }
  } else if (type === 'count_up') {
    const totalScore = finalScore as number
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
    id: 'shared-' + date, // Generate a temp ID
    type,
    targetScore,
    date,
    winner,
    finalScore,
    rounds,
    stats,
  }
}
