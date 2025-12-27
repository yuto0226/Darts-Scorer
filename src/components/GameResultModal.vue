<script setup lang="ts">
import type { GameRecord } from '../stores/history'
import HistoryChart from './HistoryChart.vue'
import { encodeGameRecord } from '../utils/codec'

defineProps<{
  visible: boolean
  winner?: string
  isAborted?: boolean
  gameRecord?: GameRecord
}>()

const emit = defineEmits<{
  (e: 'close', result: 'Win' | 'Loss' | 'Abort' | 'Discard' | 'Cancel'): void
}>()

const shareGame = (record: GameRecord) => {
  const compressed = encodeGameRecord(record)
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
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <h2 v-if="isAborted">End Game</h2>
      <h2 v-else>Game Over!</h2>

      <div class="modal-body">
        <h1 v-if="gameRecord?.type === 'count_up'" class="result-text">
          Score: {{ gameRecord.finalScore }}
        </h1>
        <h1 v-else-if="winner && !isAborted" class="result-text">{{ winner }}</h1>

        <div v-if="gameRecord?.stats && !isAborted" class="stats-summary">
          <span v-if="gameRecord.stats.ppd">PPD: {{ gameRecord.stats.ppd }}</span>
          <span v-if="gameRecord.stats.mpr">MPR: {{ gameRecord.stats.mpr }}</span>
        </div>

        <div v-if="gameRecord && !isAborted" class="chart-preview">
          <HistoryChart :game="gameRecord" :height="200" />
        </div>

        <p v-if="isAborted" style="margin: 10px 0 5px 0; font-weight: bold">Select result:</p>
      </div>

      <div class="actions">
        <template v-if="isAborted">
          <button class="loss-btn" @click="emit('close', 'Loss')">I Lost (Save)</button>
          <button class="abort-btn" @click="emit('close', 'Discard')">Discard (No Save)</button>
          <button class="cancel-btn" @click="emit('close', 'Cancel')">Cancel</button>
        </template>
        <template v-else>
          <button class="share-btn" v-if="gameRecord" @click="shareGame(gameRecord)">
            Share Result
          </button>
          <button class="ok-btn" @click="emit('close', 'Win')">OK</button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 15px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  margin: 20px; /* Add margin to ensure it doesn't touch screen edges */
  overflow: hidden;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0; /* Removed padding to align chart with buttons */
}

.chart-preview {
  margin: 10px 0;
  height: auto;
  flex-shrink: 0;
}

h2 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #333;
  flex-shrink: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding-bottom: 0px;
  flex-shrink: 0;
}

button {
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.win-btn {
  background: #4caf50;
  color: white;
}
.loss-btn {
  background: #f44336;
  color: white;
}
.abort-btn {
  background: #9e9e9e;
  color: white;
}
.cancel-btn {
  background: transparent;
  border: 1px solid #ccc;
  color: #666;
}
.ok-btn {
  background: #2196f3;
  color: white;
  width: 100%;
}
.share-btn {
  background: #ff9800;
  color: white;
  width: 100%;
}

.result-text {
  font-size: 2.5rem;
  font-weight: 900;
  color: #e91e63;
  margin: 0 0 5px 0;
}

.stats-summary {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 5px 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}
</style>
