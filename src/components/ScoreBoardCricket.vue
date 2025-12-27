<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
const targets = [20, 19, 18, 17, 16, 15, 25]
</script>

<template>
  <div class="scoreboard-cricket">
    <div class="score">{{ store.cricketState.score }}</div>
    <div class="grid">
      <div v-for="t in targets" :key="t" class="row">
        <div class="label">{{ t === 25 ? 'Bull' : t }}</div>
        <div class="mark-container">
          <!-- Custom Mark Rendering -->
          <svg width="40" height="40" viewBox="0 0 40 40" class="mark-svg">
            <!-- 1 Mark: / -->
            <line
              v-if="(store.cricketState.marks[t] || 0) >= 1"
              x1="5"
              y1="35"
              x2="35"
              y2="5"
              stroke="black"
              stroke-width="4"
            />
            <!-- 2 Marks: X -->
            <line
              v-if="(store.cricketState.marks[t] || 0) >= 2"
              x1="5"
              y1="5"
              x2="35"
              y2="35"
              stroke="black"
              stroke-width="4"
            />
            <!-- 3 Marks: Circle around X -->
            <circle
              v-if="(store.cricketState.marks[t] || 0) >= 3"
              cx="20"
              cy="20"
              r="18"
              stroke="black"
              stroke-width="3"
              fill="none"
            />
          </svg>
        </div>
        <!-- Opponent Closed Toggle -->
        <div
          class="opponent-closed"
          :class="{ active: store.cricketState.opponentClosed[t] }"
          @click="store.toggleOpponentClosed(t)"
        >
          🔒
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scoreboard-cricket {
  width: 100%;
  margin-bottom: 30px;
}
.score {
  font-size: 4rem;
  font-weight: 900;
  text-align: center;
  margin-bottom: 10px;
  color: #42b883;
  line-height: 1;
}
.grid {
  display: flex;
  justify-content: space-between;
  gap: 2px;
  width: 100%;
}
.row {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ddd;
  padding: 2px;
  border-radius: 4px;
  min-width: 32px;
  flex: 1;
}
.label {
  font-weight: bold;
  margin-bottom: 2px;
  font-size: 0.9rem;
}
.mark-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
}
.mark-svg {
  width: 30px;
  height: 30px;
}
.opponent-closed {
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.2;
  margin-top: 5px;
}
.opponent-closed.active {
  opacity: 1;
}
.info {
  text-align: center;
  margin-top: 10px;
  color: #666;
}
</style>
