<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { BsLockFill } from '@kalimahapps/vue-icons/bs'

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
          <svg viewBox="0 0 40 40" class="mark-svg">
            <!-- 1 Mark: / -->
            <line
              v-if="(store.cricketState.marks[t] || 0) >= 1"
              x1="8"
              y1="32"
              x2="32"
              y2="8"
              stroke="#333"
              stroke-width="3"
              stroke-linecap="round"
            />
            <!-- 2 Marks: X -->
            <line
              v-if="(store.cricketState.marks[t] || 0) >= 2"
              x1="8"
              y1="8"
              x2="32"
              y2="32"
              stroke="#333"
              stroke-width="3"
              stroke-linecap="round"
            />
            <!-- 3 Marks: Circle around X -->
            <circle
              v-if="(store.cricketState.marks[t] || 0) >= 3"
              cx="20"
              cy="20"
              r="16"
              stroke="#333"
              stroke-width="2"
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
          <BsLockFill />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scoreboard-cricket {
  width: 100%;
  margin-bottom: 0; /* Removed margin */
  padding: 0 20px; /* Increased padding for edge spacing */
  box-sizing: border-box;
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
  /* border: 1px solid #ddd; Removed border */
  padding: 4px 2px;
  border-radius: 4px;
  min-width: 0;
  flex: 1;
  background: transparent; /* Removed background */
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
  flex: 1; /* Allow it to grow */
  width: 100%;
  min-height: 32px; /* Minimum height */
}
.mark-svg {
  width: 100%;
  height: 100%;
  max-width: 100%; /* Remove fixed max-width */
  max-height: 100%; /* Remove fixed max-height */
  aspect-ratio: 1; /* Keep it square */
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
