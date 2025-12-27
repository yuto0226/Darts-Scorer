<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore, type GameRecord } from '../stores/history'
import StatsChart from '../components/StatsChart.vue'

const router = useRouter()
const historyStore = useHistoryStore()

const filterType = ref<'ALL' | '01' | 'CRICKET' | 'COUNT UP'>('ALL')

const filteredGames = computed(() => {
  if (filterType.value === 'ALL') return historyStore.games
  if (filterType.value === '01') return historyStore.games.filter((g) => g.type === '01')
  if (filterType.value === 'CRICKET') return historyStore.games.filter((g) => g.type === 'cricket')
  if (filterType.value === 'COUNT UP')
    return historyStore.games.filter((g) => g.type === 'count_up')
  return historyStore.games
})

const recentStats = computed(() => {
  const last10 = historyStore.games.slice(0, 10)
  const ppdGames = last10.filter((g) => g.type === '01' && g.stats?.ppd)
  const mprGames = last10.filter((g) => g.type === 'cricket' && g.stats?.mpr)

  const avgPPD = ppdGames.length
    ? (ppdGames.reduce((sum, g) => sum + (g.stats?.ppd || 0), 0) / ppdGames.length).toFixed(2)
    : '-'

  const avgMPR = mprGames.length
    ? (mprGames.reduce((sum, g) => sum + (g.stats?.mpr || 0), 0) / mprGames.length).toFixed(2)
    : '-'

  return { avgPPD, avgMPR }
})

const getGameLabel = (game: GameRecord) => {
  if (game.type === '01' && game.targetScore) {
    return game.targetScore.toString()
  }
  return game.type.toUpperCase()
}

const getResultLabel = (game: GameRecord) => {
  if (game.type === 'count_up') return 'Finish'
  if (game.winner === 'Win' || game.winner === 'Player 1') return 'Win'
  return 'Lose'
}

const goBack = () => {
  router.push('/')
}

const goToDetails = (id: string) => {
  router.push(`/history/${id}`)
}

const deleteGame = (e: Event, id: string) => {
  e.stopPropagation()
  if (confirm('Are you sure you want to delete this game?')) {
    historyStore.deleteGame(id)
  }
}
</script>

<template>
  <div class="history">
    <header class="sticky-header">
      <button @click="goBack">Back</button>
      <h1>History</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="content-wrapper">
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-label">Avg PPD (Last 10)</div>
          <div class="stat-value">{{ recentStats.avgPPD }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg MPR (Last 10)</div>
          <div class="stat-value">{{ recentStats.avgMPR }}</div>
        </div>
      </div>

      <div class="chart-container" v-if="historyStore.games.length > 0">
        <StatsChart :games="historyStore.games" />
      </div>

      <div class="filters">
        <button :class="{ active: filterType === 'ALL' }" @click="filterType = 'ALL'">ALL</button>
        <button :class="{ active: filterType === '01' }" @click="filterType = '01'">01</button>
        <button :class="{ active: filterType === 'CRICKET' }" @click="filterType = 'CRICKET'">
          CRICKET
        </button>
        <button :class="{ active: filterType === 'COUNT UP' }" @click="filterType = 'COUNT UP'">
          COUNT UP
        </button>
      </div>

      <div class="list">
        <div v-if="filteredGames.length === 0" class="empty">No games found.</div>
        <div
          v-else
          v-for="game in filteredGames"
          :key="game.id"
          class="game-item"
          @click="goToDetails(game.id)"
        >
          <div class="game-summary">
            <div class="game-info">
              <span class="type">{{ getGameLabel(game) }}</span>
              <span class="date">{{ new Date(game.date).toLocaleString() }}</span>
              <button class="delete-btn" @click="deleteGame($event, game.id)">🗑️</button>
            </div>
            <div class="result">
              {{ getResultLabel(game) }}
              <span v-if="game.type === '01'"> | Rounds: {{ game.rounds?.length || '-' }}</span>
              <span v-else> | Score: {{ game.finalScore }}</span>
              <span v-if="game.type === 'count_up' && game.stats?.ppr">
                | Avg: {{ game.stats.ppr }}
              </span>
              <span v-else-if="game.stats?.ppd"> | PPD: {{ game.stats.ppd }}</span>
              <span v-if="game.stats?.mpr"> | MPR: {{ game.stats.mpr }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history {
  max-width: 800px;
  margin: 0 auto;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0;
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

h1 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 1.5rem;
  white-space: nowrap;
}

.header-spacer {
  width: 40px; /* Approximate width of Back button to balance if using flex, but absolute handles center */
  visibility: hidden;
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

.stats-overview {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  padding: 20px 20px 0 20px;
}

.stat-card {
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2196f3;
}

.chart-container {
  height: 180px;
  margin: 0 20px 10px 20px;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  overflow-x: auto;
  padding-bottom: 10px; /* For scrollbar */
  padding-top: 10px;
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 5;
  padding-left: 20px;
  padding-right: 20px;
}

.filters button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  background: white;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.filters button.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.list {
  padding: 0 20px 20px 20px;
}

.game-item {
  background: #f0f0f0;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.game-item:hover {
  background: #e0e0e0;
}

.game-summary {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.type {
  font-weight: bold;
  color: #333;
  background: #ddd;
  padding: 2px 6px;
  border-radius: 4px;
}

.delete-btn {
  background: transparent;
  border: none;
  padding: 4px;
  font-size: 1.2rem;
}

.result {
  font-weight: bold;
  font-size: 1.1rem;
}

.empty {
  text-align: center;
  color: #666;
  margin-top: 40px;
}
</style>
