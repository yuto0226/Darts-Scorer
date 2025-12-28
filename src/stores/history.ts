import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { DartScore } from '../utils/darts'

export interface RoundRecord {
  round: number
  throws: DartScore[]
  scoreAfter: number | Record<number, number> // 01 score or Cricket marks
}

export interface GameRecord {
  id: string
  type: '01' | 'cricket' | 'count_up'
  targetScore?: number // For 01 games (e.g. 301, 501)
  date: number
  winner: string
  finalScore: number
  rounds: RoundRecord[]
  stats?: {
    ppd?: number
    ppr?: number
    mpr?: number
  }
}

export const useHistoryStore = defineStore('history', () => {
  const games = ref<GameRecord[]>([])

  // Load from localStorage
  const saved = localStorage.getItem('darts_history')
  if (saved) {
    try {
      games.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load history', e)
    }
  }

  // Save to localStorage whenever games change
  watch(
    games,
    (val) => {
      localStorage.setItem('darts_history', JSON.stringify(val))
    },
    { deep: true },
  )

  function addGame(game: GameRecord) {
    games.value.unshift(game)
  }

  function deleteGame(id: string) {
    const index = games.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      games.value.splice(index, 1)
    }
  }

  return { games, addGame, deleteGame }
})
