<script setup lang="ts">
defineProps<{
  visible: boolean
  winner?: string
  isAborted?: boolean
}>()

const emit = defineEmits<{
  (e: 'close', result: 'Win' | 'Loss' | 'Abort' | 'Cancel'): void
}>()
</script>

<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <h2 v-if="isAborted">End Game</h2>
      <h2 v-else>Game Over!</h2>

      <p v-if="winner && !isAborted">Winner: {{ winner }}</p>
      <p v-if="isAborted">Select result:</p>

      <div class="actions">
        <template v-if="isAborted">
          <button class="win-btn" @click="emit('close', 'Win')">I Won</button>
          <button class="loss-btn" @click="emit('close', 'Loss')">I Lost</button>
          <button class="abort-btn" @click="emit('close', 'Abort')">Just Quit</button>
          <button class="cancel-btn" @click="emit('close', 'Cancel')">Cancel</button>
        </template>
        <template v-else>
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
  padding: 20px;
  border-radius: 12px;
  width: 80%;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

h2 {
  margin-top: 0;
  color: #333;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 12px;
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
</style>
