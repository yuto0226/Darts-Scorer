<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '../stores/history'
import HistoryChart from '../components/HistoryChart.vue'

const router = useRouter()
const historyStore = useHistoryStore()
const expandedGameId = ref<string | null>(null)

const goBack = () => {
  router.push('/')
}

const toggleExpand = (id: string) => {
  if (expandedGameId.value === id) {
    expandedGameId.value = null
  } else {
    expandedGameId.value = id
  }
}
</script>

<template>
  <div class="history">
    <header>
      <button @click="goBack">Back</button>
      <h1>History</h1>
    </header>
    <div class="list">
      <div v-if="historyStore.games.length === 0" class="empty">No games played yet.</div>
      <div
        v-else
        v-for="game in historyStore.games"
        :key="game.id"
        class="game-item"
        @click="toggleExpand(game.id)"
      >
        <div class="game-summary">
          <div class="game-info">
            <span class="type">{{ game.type.toUpperCase() }}</span>
            <span class="date">{{ new Date(game.date).toLocaleString() }}</span>
          </div>
          <div class="result">Winner: {{ game.winner }} | Score: {{ game.finalScore }}</div>
        </div>

        <div v-if="expandedGameId === game.id" class="game-details">
          <HistoryChart :game="game" />
          <h4>Round History</h4>
          <div class="rounds-table">
            <div class="table-header">
              <span>R</span>
              <span>Throws</span>
            </div>
            <div v-for="round in game.rounds" :key="round.round" class="table-row">
              <span class="round-num">{{ round.round }}</span>
              <span class="throws">
                {{ round.throws.map((t) => t.label).join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history {
  padding: 20px;
}

header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
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

.game-info {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 5px;
}

.game-details {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #ccc;
}

.rounds-table {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.table-header {
  display: flex;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

.table-row {
  display: flex;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.round-num {
  width: 30px;
  font-weight: bold;
}

.throws {
  flex: 1;
}
</style>
