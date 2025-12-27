import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DartScore } from '../utils/darts'

export type GameType = '01' | 'cricket'

interface ThrowRecord {
  score: DartScore
  playerIndex: number
  round: number
  throwIndex: number // 0, 1, 2
}

export const useGameStore = defineStore('game', () => {
  const gameType = ref<GameType>('01')
  const targetScore = ref(301) // For 01

  // State
  const currentRound = ref(1)
  const currentThrow = ref(0) // 0, 1, 2
  const currentPlayerIndex = ref(0)
  const currentTurnThrows = ref<DartScore[]>([])

  // History for Undo
  const throwHistory = ref<ThrowRecord[]>([])

  // 01 State
  const score01 = ref(301)
  const roundStartScore01 = ref(301)

  // Cricket State
  const cricketState = ref<{
    marks: Record<number, number>
    opponentClosed: Record<number, boolean>
    score: number
    closed: boolean
  }>({
    marks: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 },
    opponentClosed: { 15: false, 16: false, 17: false, 18: false, 19: false, 20: false, 25: false },
    score: 0,
    closed: false,
  })

  const isGameOver = ref(false)
  const winner = ref('')
  const waitingForNextRound = ref(false)
  const isBust = ref(false)

  function initGame(type: GameType, target = 301) {
    gameType.value = type
    targetScore.value = target

    currentRound.value = 1
    currentThrow.value = 0
    currentPlayerIndex.value = 0
    throwHistory.value = []
    currentTurnThrows.value = []
    isGameOver.value = false
    winner.value = ''
    waitingForNextRound.value = false
    isBust.value = false

    // Reset 01
    score01.value = target
    roundStartScore01.value = target

    // Reset Cricket
    cricketState.value = {
      marks: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 },
      opponentClosed: {
        15: false,
        16: false,
        17: false,
        18: false,
        19: false,
        20: false,
        25: false,
      },
      score: 0,
      closed: false,
    }
  }

  function recordThrow(dart: DartScore) {
    if (isGameOver.value || waitingForNextRound.value || currentThrow.value >= 3) return

    isBust.value = false

    // Save for undo
    throwHistory.value.push({
      score: dart,
      playerIndex: currentPlayerIndex.value,
      round: currentRound.value,
      throwIndex: currentThrow.value,
    })

    currentTurnThrows.value.push(dart)

    internalProcessThrow(dart)
  }

  function internalProcessThrow(dart: DartScore) {
    if (gameType.value === '01') {
      // Soft Darts 01: Fat Bull (Outer 25 -> 50, Inner 50 -> 50)
      let val = dart.score * dart.multiplier
      if (dart.score === 25 || dart.score === 50) {
        val = 50
      }

      const newScore = score01.value - val

      if (newScore === 0) {
        score01.value = 0
        isGameOver.value = true
        winner.value = 'Player 1'
      } else if (newScore < 0) {
        score01.value = roundStartScore01.value
        isBust.value = true
        internalNextTurn(true)
        return
      } else {
        score01.value = newScore
      }
    } else {
      const num = dart.score
      let target = num
      let hits = dart.multiplier
      if (num === 25 || num === 50) {
        target = 25
        if (num === 50) hits = 2
      }

      // Check if target is valid cricket number
      if (cricketState.value.marks[target] !== undefined) {
        const current = cricketState.value.marks[target]!
        if (current < 3) {
          const needed = 3 - current
          const used = Math.min(hits, needed)
          cricketState.value.marks[target]! += used
          hits -= used
        }
        if (hits > 0) {
          // Only score if opponent hasn't closed it
          if (!cricketState.value.opponentClosed[target]) {
            cricketState.value.score += hits * target
          }
        }
      }
      checkCricketWin()
    }

    currentThrow.value++
    if (currentThrow.value >= 3) {
      // Wait for user to click next round
      waitingForNextRound.value = true
    }
  }

  function checkCricketWin() {
    const allClosed = [15, 16, 17, 18, 19, 20, 25].every(
      (n) => (cricketState.value.marks[n] || 0) >= 3,
    )
    if (allClosed) {
      isGameOver.value = true
      winner.value = 'Player 1'
    }
  }

  function internalNextTurn(bust = false) {
    if (isGameOver.value) return

    waitingForNextRound.value = false
    currentRound.value++
    currentThrow.value = 0
    currentTurnThrows.value = []

    if (gameType.value === '01') {
      if (bust) {
        // Already reset
      } else {
        roundStartScore01.value = score01.value
      }
    }
  }

  function undo() {
    if (throwHistory.value.length === 0) return
    // Only allow undo if in the same round
    const lastThrow = throwHistory.value[throwHistory.value.length - 1]
    // if (lastThrow && lastThrow.round !== currentRound.value) return // Removed to allow full undo

    if (isGameOver.value) isGameOver.value = false
    if (waitingForNextRound.value) waitingForNextRound.value = false
    if (isBust.value) isBust.value = false

    // Remove last
    throwHistory.value.pop()

    const historyCopy = [...throwHistory.value]

    // Reset
    initGame(gameType.value, targetScore.value)

    // Replay
    historyCopy.forEach((rec) => {
      // Advance rounds if needed
      while (currentRound.value < rec.round) {
        internalNextTurn()
      }
      internalProcessThrow(rec.score)
    })

    // Restore history
    throwHistory.value = historyCopy

    // Rebuild currentTurnThrows from history for the current round
    currentTurnThrows.value = throwHistory.value
      .filter((t) => t.round === currentRound.value)
      .sort((a, b) => a.throwIndex - b.throwIndex)
      .map((t) => t.score)

    // If we undid the first throw of a round (or a bust), we might be left at the end of the previous round.
    // We need to advance to the correct round state.
    if (lastThrow && currentRound.value < lastThrow.round) {
      internalNextTurn()
    }
  }

  function toggleOpponentClosed(target: number) {
    if (cricketState.value.opponentClosed[target] !== undefined) {
      cricketState.value.opponentClosed[target] = !cricketState.value.opponentClosed[target]
    }
  }

  return {
    gameType,
    targetScore,
    currentRound,
    currentThrow,
    currentPlayerIndex,
    currentTurnThrows,
    score01,
    cricketState,
    isGameOver,
    winner,
    waitingForNextRound,
    isBust,
    throwHistory,
    initGame,
    recordThrow,
    undo,
    nextRound: () => internalNextTurn(),
    toggleOpponentClosed,
  }
})
