<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { GameRecord } from '../stores/history'
import HistoryChart from '../components/HistoryChart.vue'
import { decodeGameRecord } from '../utils/codec'

const route = useRoute()
const router = useRouter()

const game = ref<GameRecord | null>(null)
const error = ref('')

onMounted(() => {
  const data = route.query.data as string
  if (!data) {
    error.value = 'No data provided'
    return
  }
  try {
    game.value = decodeGameRecord(data)
  } catch (e) {
    console.error(e)
    error.value = 'Invalid data'
  }
})

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

const shareGame = () => {
  if (navigator.share) {
    navigator
      .share({
        title: 'Darts Game Result',
        text: `Check out this darts game!`,
        url: window.location.href,
      })
      .catch(console.error)
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!')
    })
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="game-details" v-if="game">
    <div class="content-scroll">
      <h1 class="share-title">Game Result</h1>

      <div class="summary">
        <div class="summary-row top-row">
          <span class="result-badge" :class="{ win: isWin }">{{ isWin ? 'WIN' : 'LOSE' }}</span>
          <span class="type-badge">{{ gameTypeLabel }}</span>
          <span class="date">{{ new Date(game.date).toLocaleString() }}</span>
        </div>
        <div class="summary-row bottom-row">
          <div class="stat-item" v-if="game.stats?.ppd">
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
        </div>
      </div>

      <div class="chart-section">
        <HistoryChart :game="game" />
      </div>

      <div class="cta-section">
        <p>Track your own darts scores!</p>
        <button class="cta-btn" @click="goHome">Start Scoring</button>
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
    <p>{{ error || 'Loading...' }}</p>
    <button @click="goHome">Go Home</button>
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
  background: #fff;
}

.share-title {
  text-align: center;
  margin: 0 0 20px 0;
  font-size: 1.8rem;
  color: #333;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.cta-section {
  text-align: center;
  margin: 0 0 20px 0;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
}

.cta-section p {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #1565c0;
  font-weight: bold;
}

.cta-btn {
  background: #2196f3;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 25px;
  box-shadow: 0 4px 6px rgba(33, 150, 243, 0.3);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  width: auto;
  height: auto;
  display: inline-flex; /* Ensure it respects text-align: center */
}

.cta-btn:active {
  transform: scale(0.98);
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

.summary {
  background: #f5f5f5;
  padding: 20px;
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
  margin-bottom: 20px;
  height: auto; /* Allow height to adjust to content */
}

.rounds-section {
  margin-bottom: 20px;
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
