import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DartScore } from '../utils/darts'

export interface RoundRecord {
  round: number
  throws: DartScore[]
  scoreAfter: number | Record<number, number> // 01 score or Cricket marks
}

export interface GameRecord {
  id: string
  type: '01' | 'cricket'
  date: number
  winner: string
  finalScore: any
  rounds: RoundRecord[]
}

export const useHistoryStore = defineStore('history', () => {
  const games = ref<GameRecord[]>([])

  function addGame(game: GameRecord) {
    games.value.unshift(game)
  }

  return { games, addGame }
})
