<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
</script>

<template>
  <div class="scoreboard-01">
    <div class="main-score">{{ store.score01 }}</div>
    <div class="info">
      <div>Round: {{ store.currentRound }}</div>
    </div>
  </div>
</template>

<style scoped>
.scoreboard-01 {
  text-align: center;
  margin-bottom: 20px;
}
.main-score {
  font-size: 4rem;
  font-weight: bold;
  color: #42b883;
}
.info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 1.2rem;
}
.last-throws {
  margin-top: 10px;
  height: 24px;
  color: #666;
}
.last-throws span {
  margin: 0 5px;
}
</style>
