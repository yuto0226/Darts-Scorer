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
import type { ChartDataset } from 'chart.js'
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
        backgroundColor: 'rgba(66, 184, 131, 0.2)',
        borderColor: 'rgba(66, 184, 131, 1)',
        data: ppdData,
        spanGaps: true,
        tension: 0.3,
      },
      {
        label: 'MPR (Cricket)',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        data: mprData,
        spanGaps: true,
        tension: 0.3,
        yAxisID: 'y1',
      },
    ] as ChartDataset<'line'>[],
  }
})

const averageData = computed(() => {
  const ppdData = (chartData.value?.datasets[0]?.data as (number | null)[]) || []
  const mprData = (chartData.value?.datasets[1]?.data as (number | null)[]) || []

  const ppdAverage = ppdData.map((_, index) => {
    const slice = ppdData.slice(0, index + 1).filter((val) => val !== null)
    return slice.length ? slice.reduce((sum, val) => sum + val, 0) / slice.length : null
  })

  const mprAverage = mprData.map((_, index) => {
    const slice = mprData.slice(0, index + 1).filter((val) => val !== null)
    return slice.length ? slice.reduce((sum, val) => sum + val, 0) / slice.length : null
  })

  return {
    ppd: ppdAverage,
    mpr: mprAverage,
  }
})

chartData.value.datasets = [
  {
    label: 'PPD (01)',
    backgroundColor: 'rgba(66, 184, 131, 0.2)',
    borderColor: 'rgba(66, 184, 131, 1)',
    data: chartData.value.datasets?.[0]?.data ?? [],
    spanGaps: true,
    tension: 0.3,
  },
  {
    label: 'MPR (Cricket)',
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderColor: 'rgba(52, 152, 219, 1)',
    data: chartData.value.datasets?.[1]?.data ?? [],
    spanGaps: true,
    tension: 0.3,
    yAxisID: 'y1',
  },
  {
    label: 'Avg PPD',
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    borderColor: 'rgba(66, 184, 131, 0.8)',
    borderDash: [5, 5],
    data: averageData.value.ppd,
    spanGaps: true,
    tension: 0.4,
  },
  {
    label: 'Avg MPR',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderColor: 'rgba(52, 152, 219, 0.8)',
    borderDash: [5, 5],
    data: averageData.value.mpr,
    spanGaps: true,
    tension: 0.4,
    yAxisID: 'y1',
  },
]

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
