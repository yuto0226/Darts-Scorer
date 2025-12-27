<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { GameRecord } from '../stores/history'
import type { DartScore } from '../utils/darts'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  game: GameRecord
}>()

const chartData = computed(() => {
  const labels = props.game.rounds.map((r) => `R${r.round}`)

  const data = props.game.rounds.map((r) => {
    return r.throws.reduce((sum: number, t: DartScore) => {
      let val = t.score * t.multiplier
      // Apply Fat Bull rule for 01 if needed, but generally for stats raw value is used or specific rules.
      // Assuming Fat Bull for 01 as per game logic.
      if (props.game.type === '01') {
        if (t.score === 25 || t.score === 50) val = 50
      }
      return sum + val
    }, 0)
  })

  return {
    labels,
    datasets: [
      {
        label: 'Score per Round',
        backgroundColor: '#2196f3',
        borderColor: '#2196f3',
        data,
        tension: 0.1,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

const averageScore = computed(() => {
  const rounds = props.game.rounds
  if (rounds.length === 0) return 0

  // Exclude last 20%
  // If rounds < 5, we might just take all or exclude none?
  // "exclude last 20%" implies we want the "steady state" performance, avoiding the "doubling out" phase which might have lower scores.

  let count = rounds.length
  if (count >= 5) {
    count = Math.floor(count * 0.8)
  }

  const validRounds = rounds.slice(0, count)

  if (validRounds.length === 0) return 0

  const totalScore = validRounds.reduce((sum, r) => {
    const roundScore = r.throws.reduce((s: number, t: DartScore) => {
      let val = t.score * t.multiplier
      if (props.game.type === '01' && (t.score === 25 || t.score === 50)) val = 50
      return s + val
    }, 0)
    return sum + roundScore
  }, 0)

  return (totalScore / validRounds.length).toFixed(1)
})
</script>

<template>
  <div class="chart-container">
    <div class="stats">
      <p>
        Average Score (first {{ Math.floor((game.rounds.length >= 5 ? 0.8 : 1) * 100) }}% of
        rounds): <strong>{{ averageScore }}</strong>
      </p>
    </div>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  margin-top: 20px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.chart-wrapper {
  height: 250px;
}
.stats {
  margin-bottom: 10px;
  text-align: center;
  font-size: 0.9rem;
  color: #555;
}
</style>
