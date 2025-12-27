<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHistoryStore } from '../stores/history'
import HistoryChart from '../components/HistoryChart.vue'
import { encodeGameRecord } from '../utils/codec'

const route = useRoute()
const router = useRouter()
const historyStore = useHistoryStore()

const gameId = route.params.id as string
const game = computed(() => historyStore.games.find((g) => g.id === gameId))

const gameTypeLabel = computed(() => {
  if (!game.value) return ''
  if (game.value.type === '01' && game.value.targetScore) {
    return game.value.targetScore.toString()
  }
  return game.value.type.toUpperCase()
})

const isWin = computed(() => {
  if (!game.value) return false
  return game.value.winner === 'Win' || game.value.winner === 'Player 1'
})

const goBack = () => {
  router.push('/history')
}

const deleteGame = () => {
  if (confirm('Are you sure you want to delete this game?')) {
    historyStore.deleteGame(gameId)
    router.push('/history')
  }
}

const shareGame = () => {
  if (!game.value) return
  const compressed = encodeGameRecord(game.value)
  const url = `${window.location.origin}/share?data=${compressed}`

  if (navigator.share) {
    navigator
      .share({
        title: 'Darts Game Result',
        text: `Check out my darts game!`,
        url: url,
      })
      .catch(console.error)
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!')
    })
  }
}
</script>

<template>
  <div class="game-details" v-if="game">
    <header class="sticky-header">
      <button @click="goBack">Back</button>
      <h1>Game Details</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="content-scroll">
      <div class="summary">
        <div class="summary-row top-row">
          <span class="result-badge" :class="{ win: isWin, finish: game.type === 'count_up' }">
            {{ game.type === 'count_up' ? 'FINISH' : isWin ? 'WIN' : 'LOSE' }}
          </span>
          <span class="type-badge">{{ gameTypeLabel }}</span>
          <span class="date">{{ new Date(game.date).toLocaleString() }}</span>
        </div>
        <div class="summary-row bottom-row">
          <div class="stat-item" v-if="game.type === 'count_up' && game.stats?.ppr">
            <span class="label">Avg</span>
            <span class="value">{{ game.stats.ppr }}</span>
          </div>
          <div class="stat-item" v-else-if="game.stats?.ppd">
            <span class="label">PPD</span>
            <span class="value">{{ game.stats.ppd }}</span>
          </div>
          <div class="stat-item" v-if="game.stats?.mpr">
            <span class="label">MPR</span>
            <span class="value">{{ game.stats.mpr }}</span>
          </div>
          <div class="stat-item">
            <span class="label">{{ game.type === '01' ? 'Rounds' : 'Final Score' }}</span>
            <span class="value">{{
              game.type === '01' ? game.rounds?.length || '-' : game.finalScore
            }}</span>
          </div>
        </div>
        <div class="summary-actions">
          <button class="share-btn" @click="shareGame">Share Result</button>
          <button class="delete-btn" @click="deleteGame">Delete Game</button>
        </div>
      </div>

      <div class="chart-section">
        <HistoryChart :game="game" />
      </div>

      <div class="rounds-section">
        <h3>Round History</h3>
        <div class="rounds-table">
          <div class="table-header">
            <span>R</span>
            <span>Throws</span>
            <span>Score</span>
          </div>
          <div v-for="round in game.rounds" :key="round.round" class="table-row">
            <span class="round-num">{{ round.round }}</span>
            <span class="throws">
              {{ round.throws.map((t) => t.label).join(', ') }}
            </span>
            <span class="round-score">
              <!-- Display score after round or marks -->
              {{ typeof round.scoreAfter === 'number' ? round.scoreAfter : '-' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <p>Game not found.</p>
    <button @click="goBack">Back to History</button>
  </div>
</template>

<style scoped>
.game-details {
  max-width: 800px;
  margin: 0 auto;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sticky-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  flex-shrink: 0;
  position: relative;
  height: 60px; /* Fixed height for consistency */
  box-sizing: border-box;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

h1 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 1.5rem;
  white-space: nowrap;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  height: 36px; /* Fixed height for consistency */
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-right {
  display: flex;
  gap: 10px;
}

.header-spacer {
  width: 40px; /* Match back button width roughly */
}

.summary-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
}

.share-btn {
  flex: 1;
  background-color: #2196f3;
  color: white;
  border: none;
  font-weight: bold;
}

.delete-btn {
  flex: 1;
  border-color: #ff5252;
  color: #ff5252;
}

.share-btn-icon {
  border-color: #2196f3;
  color: #2196f3;
}

.summary {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.summary-row {
  display: flex;
  align-items: center;
}

.top-row {
  gap: 15px;
  flex-wrap: wrap;
}

.bottom-row {
  justify-content: space-around;
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
}

.result-badge {
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 16px;
  background: #e0e0e0;
  color: #666;
  text-transform: uppercase;
}

.result-badge.win {
  background: #4caf50;
  color: white;
}

.result-badge.finish {
  background: #9c27b0;
  color: white;
}

.type-badge {
  font-weight: bold;
  background: #2196f3;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.date {
  color: #666;
  font-size: 0.9rem;
  margin-left: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.chart-section {
  margin-bottom: 30px;
  height: auto;
}

.rounds-table {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 60px;
  background: #eee;
  padding: 10px;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 60px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.table-row:last-child {
  border-bottom: none;
}

.round-num {
  font-weight: bold;
  color: #666;
}

.not-found {
  text-align: center;
  padding: 50px;
}
</style>
