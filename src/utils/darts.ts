export interface DartScore {
  score: number
  multiplier: 1 | 2 | 3
  label: string // e.g., "T20", "D1", "Bull", "Miss"
  isInner?: boolean
}

const SLICES = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

// Radii in normalized units (0-100, where 100 is outer edge of double ring)
const R_BULL_INNER = 6.0
const R_BULL_OUTER = 15.0
const R_TRIPLE_INNER = 55.0
const R_TRIPLE_OUTER = 65.0
const R_DOUBLE_INNER = 90.0
const R_DOUBLE_OUTER = 100.0

export function getScoreFromCoordinates(x: number, y: number): DartScore {
  // x, y are relative to center (0,0)
  const distance = Math.sqrt(x * x + y * y)

  // Check Bulls
  if (distance <= R_BULL_INNER) {
    return { score: 50, multiplier: 1, label: 'D-Bull' } // Often counted as Double 25
  }
  if (distance <= R_BULL_OUTER) {
    return { score: 25, multiplier: 1, label: 'S-Bull' }
  }

  if (distance > R_DOUBLE_OUTER) {
    return { score: 0, multiplier: 1, label: 'Miss' }
  }

  // Calculate Angle
  // Math.atan2(y, x) returns angle in radians.
  // 0 is right (3 o'clock), positive is clockwise (if y is down) or counter-clockwise (if y is up).
  // Let's assume standard SVG coords: x right, y down.
  // 0 is 3 o'clock. 20 is at 12 o'clock (-90 deg).

  const angle = Math.atan2(y, x) * (180 / Math.PI) // -180 to 180

  // Adjust so 0 is at 12 o'clock (slice 20) and goes clockwise
  // Current: 0 at 3 o'clock.
  // We want 20 (top) to be index 0.
  // At top, atan2(y=-1, x=0) is -90.
  // We want -90 to map to index 0 (slice 20).
  // 360 / 20 = 18 degrees per slice.
  // Slice 20 center is -90. It spans -99 to -81.

  // Rotate angle so 0 is at -90 (top)
  // angle += 90. Now 0 is top.
  // But wait, atan2 goes -180 to 180.

  // Let's normalize to 0-360 clockwise from 12 o'clock.
  // SVG: y is down.
  // 12 o'clock: x=0, y=-1. atan2 = -PI/2 (-90 deg).
  // 3 o'clock: x=1, y=0. atan2 = 0.
  // 6 o'clock: x=0, y=1. atan2 = PI/2 (90 deg).
  // 9 o'clock: x=-1, y=0. atan2 = PI (180 deg) or -PI.

  // We want degrees clockwise from 12 o'clock.
  // -90 -> 0
  // 0 -> 90
  // 90 -> 180
  // 180 -> 270
  // -179 -> 271

  let degrees = angle + 90
  if (degrees < 0) degrees += 360

  // Now degrees is 0 at 12 o'clock, increasing clockwise.
  // Each slice is 18 degrees.
  // Slice 20 is centered at 0. So it's from 351 to 9.
  // We can offset by 9 degrees to make math floor easy.

  const sliceIndex = Math.floor(((degrees + 9) % 360) / 18)
  const score = SLICES[sliceIndex] || 0

  let multiplier: 1 | 2 | 3 = 1
  let prefix = 'S'
  let isInner = false

  if (distance >= R_TRIPLE_INNER && distance <= R_TRIPLE_OUTER) {
    multiplier = 3
    prefix = 'T'
  } else if (distance >= R_DOUBLE_INNER && distance <= R_DOUBLE_OUTER) {
    multiplier = 2
    prefix = 'D'
  } else if (distance < R_TRIPLE_INNER) {
    isInner = true
  }

  return {
    score: score,
    multiplier: multiplier,
    label: `${prefix}${score}`,
    isInner: isInner,
  }
}
