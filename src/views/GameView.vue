<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore, type GameType } from '../stores/game'
import { useHistoryStore, type RoundRecord } from '../stores/history'
import Dartboard from '../components/Dartboard.vue'
import ScoreBoard01 from '../components/ScoreBoard01.vue'
import ScoreBoardCricket from '../components/ScoreBoardCricket.vue'
import GameResultModal from '../components/GameResultModal.vue'
import type { DartScore } from '../utils/darts'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const historyStore = useHistoryStore()

const showModal = ref(false)
const modalWinner = ref('')
const isAborted = ref(false)

onMounted(() => {
  const type = route.params.type as GameType
  if (type !== '01' && type !== 'cricket') {
    router.replace('/')
    return
  }
  // Default 301 for 01
  const target = route.query.target ? parseInt(route.query.target as string) : 301
  gameStore.initGame(type, target)
})

const onHit = (score: DartScore) => {
  gameStore.recordThrow(score)
}

const onMiss = () => {
  gameStore.recordThrow({ score: 0, multiplier: 1, label: 'Miss' })
}

const onUndo = () => {
  gameStore.undo()
}

const onFinish = (result?: 'Win' | 'Loss' | 'Abort') => {
  // Process history to group by round
  const rounds: RoundRecord[] = []
  const history = gameStore.throwHistory

  // Simple grouping
  const maxRound = history.length > 0 ? history[history.length - 1]!.round : 0
  for (let r = 1; r <= maxRound; r++) {
    const throws = history
      .filter((t) => t.round === r)
      .sort((a, b) => a.throwIndex - b.throwIndex)
      .map((t) => t.score)
    if (throws.length > 0) {
      rounds.push({
        round: r,
        throws: throws,
        scoreAfter: 0, // We don't track score snapshot yet, but can be inferred if needed. For now just throws.
      })
    }
  }

  let winner = gameStore.winner || 'Aborted'
  if (result) {
    if (result === 'Win') winner = 'Player 1'
    else if (result === 'Loss') winner = 'Opponent'
    else winner = 'Aborted'
  }

  // Save and exit
  historyStore.addGame({
    id: Date.now().toString(),
    type: gameStore.gameType,
    date: Date.now(),
    winner: winner,
    finalScore: gameStore.gameType === '01' ? gameStore.score01 : gameStore.cricketState.score,
    rounds: rounds,
  })
  router.push('/')
}

const confirmExit = () => {
  isAborted.value = true
  showModal.value = true
}

const handleModalClose = (result: 'Win' | 'Loss' | 'Abort' | 'Cancel') => {
  showModal.value = false
  if (result === 'Cancel') return
  onFinish(result)
}

watch(
  () => gameStore.isGameOver,
  (val) => {
    if (val) {
      setTimeout(() => {
        modalWinner.value = gameStore.winner
        isAborted.value = false
        showModal.value = true
      }, 500)
    }
  },
)
</script>

<template>
  <div class="game-view">
    <header>
      <button @click="confirmExit" class="back-btn">End Game</button>
      <button @click="onUndo" :disabled="gameStore.throwHistory.length === 0">Undo</button>
    </header>

    <div class="content">
      <ScoreBoard01 v-if="gameStore.gameType === '01'" />
      <ScoreBoardCricket v-else />

      <div class="current-throws">
        <div v-for="i in 3" :key="i" class="throw-slot">
          <span v-if="gameStore.currentTurnThrows[i - 1]">
            {{ gameStore.currentTurnThrows[i - 1]?.label }}
          </span>
          <span v-else class="placeholder">-</span>
        </div>
      </div>

      <Dartboard @hit="onHit" />

      <div class="controls">
        <button
          v-if="gameStore.waitingForNextRound"
          class="next-btn"
          @click="gameStore.nextRound()"
        >
          NEXT ROUND
        </button>
        <button v-else class="miss-btn" @click="onMiss">MISS</button>
      </div>
    </div>

    <GameResultModal
      :visible="showModal"
      :winner="modalWinner"
      :is-aborted="isAborted"
      @close="handleModalClose"
    />
  </div>
</template>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: 10px;
  box-sizing: border-box;
}

header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  flex-shrink: 0;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: white;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  overflow-y: auto;
}

.current-throws {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  flex-shrink: 0;
}

.throw-slot {
  width: 60px;
  height: 60px;
  border: 2px solid #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  background: white;
}

.placeholder {
  color: #ccc;
}

.controls {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 5px;
  flex-shrink: 0;
  padding-bottom: 10px;
}

.miss-btn {
  background-color: #ff5252;
  color: white;
  border: none;
  font-weight: bold;
  width: 100px;
  height: 50px;
  font-size: 1.2rem;
}

.next-btn {
  background-color: #2196f3;
  color: white;
  border: none;
  font-weight: bold;
  width: 150px;
  height: 50px;
  font-size: 1.2rem;
  animation: pulse-btn 1s infinite;
}

@keyframes pulse-btn {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
