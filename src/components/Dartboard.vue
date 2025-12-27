<script setup lang="ts">
import { ref, computed } from 'vue'
import { getScoreFromCoordinates, type DartScore } from '../utils/darts'

const props = defineProps<{
  hits?: DartScore[]
}>()

const emit = defineEmits<{
  (e: 'hit', score: DartScore): void
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const lastHit = ref<{ x: number; y: number } | null>(null)

const onClick = (e: MouseEvent) => {
  if (!svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()

  // ViewBox is -120 -120 240 240
  const viewBoxSize = 240
  const offset = 120

  // Simple mapping if we assume square and fit
  const x = (e.clientX - rect.left) * (viewBoxSize / rect.width) - offset
  const y = (e.clientY - rect.top) * (viewBoxSize / rect.height) - offset

  lastHit.value = { x, y }

  const result = getScoreFromCoordinates(x, y)
  emit('hit', result)
}

// Constants for drawing
const SLICES = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
const R_BULL_INNER = 6.0
const R_BULL_OUTER = 15.0
const R_TRIPLE_INNER = 55.0
const R_TRIPLE_OUTER = 65.0
const R_DOUBLE_INNER = 90.0
const R_DOUBLE_OUTER = 100.0

// Generate paths for numbers
const textRadius = 112
const getTextPos = (i: number) => {
  const angle = (i * 18 - 90) * (Math.PI / 180)
  return {
    x: Math.cos(angle) * textRadius,
    y: Math.sin(angle) * textRadius,
    text: SLICES[i],
  }
}

const hitMarkers = computed(() => {
  if (!props.hits) return []
  return props.hits
    .map((hit, index) => {
      let r = 0
      let angle = 0

      if (hit.score === 0) {
        // Miss: Place in the outer ring (radius 100-120)
        // Distribute them at the bottom: 135, 180, 225 degrees?
        // Or just random/fixed spots.
        // Let's put them at the bottom area.
        // Index 0: 150 deg, Index 1: 180 deg, Index 2: 210 deg
        const missAngles = [150, 180, 210]
        // Use index % 3 just in case
        angle = (missAngles[index % 3] - 90) * (Math.PI / 180)
        r = 110
      } else if (hit.score === 25) {
        r = (R_BULL_INNER + R_BULL_OUTER) / 2
        angle = -Math.PI / 2
      } else if (hit.score === 50) {
        r = 0
        angle = 0
      } else {
        const sliceIndex = SLICES.indexOf(hit.score)
        if (sliceIndex === -1) return null

        angle = (sliceIndex * 18 - 90) * (Math.PI / 180)

        if (hit.multiplier === 1) {
          if (hit.isInner) {
            // Place in inner single
            r = (R_BULL_OUTER + R_TRIPLE_INNER) / 2
          } else {
            // Place in outer single
            r = (R_TRIPLE_OUTER + R_DOUBLE_INNER) / 2
          }
        } else if (hit.multiplier === 2) {
          r = (R_DOUBLE_INNER + R_DOUBLE_OUTER) / 2
        } else if (hit.multiplier === 3) {
          r = (R_TRIPLE_INNER + R_TRIPLE_OUTER) / 2
        }
      }

      return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        label: hit.score === 0 ? 'M' : (index + 1).toString(),
        isMiss: hit.score === 0,
      }
    })
    .filter((m): m is { x: number; y: number; label: string; isMiss: boolean } => m !== null)
})
</script>

<template>
  <div class="dartboard-container">
    <svg ref="svgRef" viewBox="-120 -120 240 240" @click="onClick" class="dartboard">
      <!-- Background -->
      <circle cx="0" cy="0" r="120" fill="#333" />

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

      <!-- Hit Markers -->
      <g v-for="(marker, i) in hitMarkers" :key="`hit-${i}`">
        <circle
          :cx="marker.x"
          :cy="marker.y"
          :r="marker.isMiss ? 6 : 4"
          :fill="marker.isMiss ? '#ff5252' : '#ffeb3b'"
          stroke="#000"
          stroke-width="0.5"
          class="hit-marker-dot"
        />
        <text
          :x="marker.x"
          :y="marker.y"
          :fill="marker.isMiss ? '#fff' : '#000'"
          font-size="5"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="middle"
          pointer-events="none"
        >
          {{ marker.label }}
        </text>
      </g>
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

.hit-marker-dot {
  pointer-events: none;
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
</style>
