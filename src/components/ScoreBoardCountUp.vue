<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
</script>

<template>
  <div class="scoreboard-countup">
    <div class="main-score">{{ store.scoreCountUp }}</div>
  </div>
</template>

<style scoped>
.scoreboard-countup {
  text-align: center;
}
.main-score {
  font-size: 6rem;
  font-weight: 900;
  color: #42b883;
  line-height: 1;
}
</style>
