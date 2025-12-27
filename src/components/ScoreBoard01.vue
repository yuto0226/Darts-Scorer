<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
</script>

<template>
  <div class="scoreboard-01">
    <div class="main-score">{{ store.score01 }}</div>
  </div>
</template>

<style scoped>
.scoreboard-01 {
  text-align: center;
  margin-bottom: 40px;
}
.main-score {
  font-size: 6rem;
  font-weight: 900;
  color: #42b883;
  line-height: 1;
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
