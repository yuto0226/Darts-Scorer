export interface CheckoutTarget {
  score: number
  multiplier: number // 1, 2, 3
}

export interface CheckoutGuide {
  steps: CheckoutTarget[]
  finalOptions?: CheckoutTarget[] // Alternative options for the final shot
  isSetup: boolean
}

// Basic checkout table for common finishes or a simple solver
// This is a simplified version. A full table is huge.
// We will try to find a solution dynamically.

const DOUBLES = Array.from({ length: 20 }, (_, i) => i + 1).map((s) => ({
  score: s,
  multiplier: 2,
}))
DOUBLES.push({ score: 25, multiplier: 2 }) // Bullseye

const TRIPLES = Array.from({ length: 20 }, (_, i) => i + 1).map((s) => ({
  score: s,
  multiplier: 3,
}))

const SINGLES = Array.from({ length: 20 }, (_, i) => i + 1).map((s) => ({
  score: s,
  multiplier: 1,
}))
SINGLES.push({ score: 25, multiplier: 1 }) // Outer Bull

const ALL_THROWS = [...DOUBLES, ...TRIPLES, ...SINGLES]

const PREFERRED_LEAVES = [32, 40, 24, 36, 16, 20]

// Cache for performance? Not really needed for depth 3.
// We want the "best" path. Standard preference:
// 1. Minimize darts.
// 2. Avoid Bull if possible (unless necessary).
// 3. Prefer even doubles?
// 4. Prefer T20/T19/T18 for scoring.

export function getCheckoutGuide(score: number, dartsRemaining: number): CheckoutGuide | null {
  if (score > 180 || score < 1) return null

  // Open Out Rule: Can finish on Single, Double, or Triple.
  // 1 Dart Finish
  if (dartsRemaining >= 1) {
    // Check ALL throws
    const oneDartOptions = ALL_THROWS.filter((d) => d.score * d.multiplier === score)
    if (oneDartOptions.length > 0) {
      // Sort options: Double > Single > Triple (Standard preference usually Double, but user wants all)
      // Let's just return them all in finalOptions
      // And steps can be empty or just the first one?
      // If we have finalOptions, the UI should display them instead of steps[0]
      return {
        steps: [oneDartOptions[0]!],
        finalOptions: oneDartOptions,
        isSetup: false,
      }
    }
  }

  // 2 Dart Finish
  if (dartsRemaining >= 2) {
    // Try to find T1 + Any = score
    // Sort ALL_THROWS descending to prefer higher first dart
    const sortedThrows = [...ALL_THROWS].sort(
      (a, b) => b.score * b.multiplier - a.score * a.multiplier,
    )

    for (const first of sortedThrows) {
      const remainder = score - first.score * first.multiplier
      if (remainder < 1) continue

      const second = ALL_THROWS.find((d) => d.score * d.multiplier === remainder)
      if (second) {
        return { steps: [first, second], isSetup: false }
      }
    }
  }

  // 3 Dart Finish
  if (dartsRemaining >= 3) {
    const sortedThrows = [...ALL_THROWS].sort(
      (a, b) => b.score * b.multiplier - a.score * a.multiplier,
    )

    for (const first of sortedThrows) {
      const rem1 = score - first.score * first.multiplier
      if (rem1 < 1) continue

      for (const second of sortedThrows) {
        const rem2 = rem1 - second.score * second.multiplier
        if (rem2 < 1) continue

        const third = ALL_THROWS.find((d) => d.score * d.multiplier === rem2)
        if (third) {
          return { steps: [first, second, third], isSetup: false }
        }
      }
    }
  }

  // Setup Suggestion (if 1 dart remaining and no finish possible)
  if (dartsRemaining === 1) {
    // Find best single dart to leave a preferred double (for next round)
    // Even though Open Out allows any finish, leaving a Double is still good practice?
    // Or maybe leaving a number divisible by 20 or 19?
    // Actually, for Open Out, leaving ANY number <= 60 (or 50) is good because you can finish in 1 dart.
    // So we want to leave <= 50 or <= 60.

    const candidates = [...SINGLES, ...TRIPLES, ...DOUBLES]

    // Try to leave <= 50 (Bull finish) or <= 60 (Triple finish)
    // Best is to leave a number that is easy to hit.
    // Let's stick to leaving preferred doubles as it's standard practice.

    for (const target of PREFERRED_LEAVES) {
      const needed = score - target
      if (needed <= 0) continue

      const setupShot = candidates.find((t) => t.score * t.multiplier === needed)
      if (setupShot) {
        return { steps: [setupShot], isSetup: true }
      }
    }

    // If no preferred leave found, find any leave <= 60 (1 dart finish range)
    const anyFinishable = candidates.find((t) => {
      const rem = score - t.score * t.multiplier
      return rem > 0 && rem <= 60
    })
    if (anyFinishable) {
      return { steps: [anyFinishable], isSetup: true }
    }
  }

  return null
}
