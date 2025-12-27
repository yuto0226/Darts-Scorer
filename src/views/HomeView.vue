<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const start01 = (target: number) => {
  router.push({ name: 'game', params: { type: '01' }, query: { target: target.toString() } })
}

const startCricket = () => {
  router.push({ name: 'game', params: { type: 'cricket' } })
}

const viewHistory = () => {
  router.push({ name: 'history' })
}
</script>

<template>
  <div class="home">
    <h1>Darts Scorer</h1>
    <div class="menu">
      <div class="group-01">
        <button @click="start01(301)">301</button>
        <button @click="start01(501)">501</button>
        <button @click="start01(701)">701</button>
      </div>
      <button @click="startCricket">Play Cricket</button>
      <button @click="viewHistory" class="secondary">History</button>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100dvh; /* Use dvh for mobile */
  padding: 20px;
  text-align: center;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 300px;
}

.group-01 {
  display: flex;
  gap: 10px;
}

.group-01 button {
  flex: 1;
  padding: 15px 0;
}

button {
  padding: 15px;
  font-size: 1.2rem;
  border-radius: 8px;
  border: none;
  background-color: #42b883;
  color: white;
  cursor: pointer;
}

button.secondary {
  background-color: #35495e;
}
</style>
