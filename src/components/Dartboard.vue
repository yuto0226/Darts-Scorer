<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getScoreFromCoordinates, type DartScore } from '../utils/darts'

const emit = defineEmits<{
  (e: 'hit', score: DartScore): void
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const lastHit = ref<{ x: number; y: number } | null>(null)

const onClick = (e: MouseEvent) => {
  if (!svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()

  // ViewBox is -110 -110 220 220
  const viewBoxSize = 220
  const offset = 110

  const scale = viewBoxSize / Math.min(rect.width, rect.height)

  // Calculate x, y relative to center of SVG
  // We need to handle aspect ratio if the element isn't square, but let's assume CSS keeps it square or we use the min dimension
  // Better approach: map client coords to SVG user units

  // Simple mapping if we assume square and fit
  const x = (e.clientX - rect.left) * (viewBoxSize / rect.width) - offset
  const y = (e.clientY - rect.top) * (viewBoxSize / rect.height) - offset

  lastHit.value = { x, y }

  const result = getScoreFromCoordinates(x, y)
  emit('hit', result)
}

// Constants for drawing
const SLICES = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
const R_BULL_INNER = 3.7
const R_BULL_OUTER = 9.4
const R_TRIPLE_INNER = 58.2
const R_TRIPLE_OUTER = 63.0
const R_DOUBLE_INNER = 95.3
const R_DOUBLE_OUTER = 100.0

// Generate paths for numbers
const textRadius = 108
const getTextPos = (i: number) => {
  const angle = (i * 18 - 90) * (Math.PI / 180)
  return {
    x: Math.cos(angle) * textRadius,
    y: Math.sin(angle) * textRadius,
    text: SLICES[i],
  }
}
</script>

<template>
  <div class="dartboard-container">
    <svg ref="svgRef" viewBox="-110 -110 220 220" @click="onClick" class="dartboard">
      <!-- Background -->
      <circle cx="0" cy="0" r="110" fill="#333" />

      <!-- Slices -->
      <g v-for="(num, i) in SLICES" :key="i" :transform="`rotate(${i * 18 - 9} 0 0)`">
        <!-- Wedge -->
        <path
          d="M0 0 L0 -100 A100 100 0 0 1 31.2 -95 L0 0"
          fill="transparent"
          stroke="#fff"
          stroke-width="0.5"
        />
        <!-- We can color them: black/white or red/green -->
        <!-- Actually, standard colors: 
             20: Black, 1: White... alternating.
             Triples/Doubles: Red/Green.
        -->
      </g>

      <!-- Draw Rings manually for better coloring -->
      <!-- This is a simplified visual representation. 
           The logic is in getScoreFromCoordinates, so the visual doesn't have to be perfect for hit detection.
      -->

      <!-- Base Black/White Slices -->
      <g v-for="(num, i) in SLICES" :key="`slice-${i}`">
        <path
          :d="`M0 0 L${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * 100} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * 100} A100 100 0 0 1 ${Math.cos(((i * 18 + 9 - 90) * Math.PI) / 180) * 100} ${Math.sin(((i * 18 + 9 - 90) * Math.PI) / 180) * 100} Z`"
          :fill="i % 2 === 0 ? 'black' : '#f0d9b5'"
          stroke="#aaa"
          stroke-width="0.5"
        />
      </g>

      <!-- Double Ring -->
      <path
        v-for="(num, i) in SLICES"
        :key="`double-${i}`"
        :d="`M${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * R_DOUBLE_INNER} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * R_DOUBLE_INNER} 
             L${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * R_DOUBLE_OUTER} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * R_DOUBLE_OUTER} 
             A100 100 0 0 1 ${Math.cos(((i * 18 + 9 - 90) * Math.PI) / 180) * R_DOUBLE_OUTER} ${Math.sin(((i * 18 + 9 - 90) * Math.PI) / 180) * R_DOUBLE_OUTER}
             L${Math.cos(((i * 18 + 9 - 90) * Math.PI) / 180) * R_DOUBLE_INNER} ${Math.sin(((i * 18 + 9 - 90) * Math.PI) / 180) * R_DOUBLE_INNER} 
             A${R_DOUBLE_INNER} ${R_DOUBLE_INNER} 0 0 0 ${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * R_DOUBLE_INNER} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * R_DOUBLE_INNER}`"
        :fill="i % 2 === 0 ? '#e91e63' : '#2196f3'"
        stroke="#aaa"
        stroke-width="0.5"
      />

      <!-- Triple Ring -->
      <path
        v-for="(num, i) in SLICES"
        :key="`triple-${i}`"
        :d="`M${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * R_TRIPLE_INNER} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * R_TRIPLE_INNER} 
             L${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * R_TRIPLE_OUTER} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * R_TRIPLE_OUTER} 
             A${R_TRIPLE_OUTER} ${R_TRIPLE_OUTER} 0 0 1 ${Math.cos(((i * 18 + 9 - 90) * Math.PI) / 180) * R_TRIPLE_OUTER} ${Math.sin(((i * 18 + 9 - 90) * Math.PI) / 180) * R_TRIPLE_OUTER}
             L${Math.cos(((i * 18 + 9 - 90) * Math.PI) / 180) * R_TRIPLE_INNER} ${Math.sin(((i * 18 + 9 - 90) * Math.PI) / 180) * R_TRIPLE_INNER} 
             A${R_TRIPLE_INNER} ${R_TRIPLE_INNER} 0 0 0 ${Math.cos(((i * 18 - 9 - 90) * Math.PI) / 180) * R_TRIPLE_INNER} ${Math.sin(((i * 18 - 9 - 90) * Math.PI) / 180) * R_TRIPLE_INNER}`"
        :fill="i % 2 === 0 ? '#e91e63' : '#2196f3'"
        stroke="#aaa"
        stroke-width="0.5"
      />

      <!-- Outer Bull -->
      <circle cx="0" cy="0" :r="R_BULL_OUTER" fill="#2196f3" stroke="#aaa" stroke-width="0.5" />
      <!-- Inner Bull -->
      <circle cx="0" cy="0" :r="R_BULL_INNER" fill="#e91e63" stroke="#aaa" stroke-width="0.5" />

      <!-- Numbers -->
      <text
        v-for="(item, i) in SLICES.map((n, idx) => getTextPos(idx))"
        :key="`text-${i}`"
        :x="item.x"
        :y="item.y"
        fill="#fff"
        font-size="8"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ item.text }}
      </text>

      <!-- Last Hit Marker (Removed as per request for less precision visual, but we can keep a subtle highlight if needed. For now, removing the dot) -->
      <!-- 
      <circle
        v-if="lastHit"
        :cx="lastHit.x"
        :cy="lastHit.y"
        r="2"
        fill="yellow"
        stroke="black"
        stroke-width="0.5"
        class="hit-marker"
      />
      -->
      />
    </svg>
  </div>
</template>

<style scoped>
.dartboard-container {
  width: 100%;
  max-width: 500px;
  /* Remove aspect-ratio to allow flex to control size, but keep it square via max-height/width logic if needed */
  /* Actually, keeping aspect-ratio is good for the board itself, but we want it to fit in available space */
  aspect-ratio: 1;
  margin: 0 auto;
  flex-shrink: 1; /* Allow shrinking */
  min-height: 0; /* Allow flex item to shrink below content size */
  max-height: 60vh; /* Limit height on mobile */
}

.dartboard {
  width: 100%;
  height: 100%;
  touch-action: none; /* Prevent scrolling when tapping on mobile */
}

.hit-marker {
  pointer-events: none;
  animation: pulse 0.5s ease-out;
}

@keyframes pulse {
  0% {
    r: 5;
    opacity: 1;
  }
  100% {
    r: 2;
    opacity: 1;
  }
}
</style>
