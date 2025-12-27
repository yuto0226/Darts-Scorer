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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  games: GameRecord[]
}>()

const chartData = computed(() => {
  // Filter last 20 games for readability
  const recentGames = props.games.slice(0, 20).reverse()

  const labels = recentGames.map((g) => {
    const date = new Date(g.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const ppdData = recentGames.map((g) => g.stats?.ppd || null)
  const mprData = recentGames.map((g) => g.stats?.mpr || null)

  return {
    labels,
    datasets: [
      {
        label: 'PPD (01)',
        backgroundColor: '#42b883',
        borderColor: '#42b883',
        data: ppdData,
        spanGaps: true,
        tension: 0.3,
      },
      {
        label: 'MPR (Cricket)',
        backgroundColor: '#42b883',
        borderColor: '#42b883',
        data: mprData,
        spanGaps: true,
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      ticks: {
        display: false,
      },
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'PPD',
      },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false,
      },
      title: {
        display: true,
        text: 'MPR',
      },
    },
  },
}
</script>

<template>
  <div class="stats-chart-container">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.stats-chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
