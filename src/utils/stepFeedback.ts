// Phase 7e: which steps were just completed, so the step card can mark them with a short motion.

// Step numbers (1-based, in level order) that are in `next` but were not in `prev`.
// `prev` is null right after a level loads, which must never count as completing anything.
export function justCompleted(prev: readonly string[] | null, next: readonly string[], order: readonly string[]): number[] {
  if (prev === null) return []
  const before = new Set(prev)
  return order.flatMap((id, i) => (next.includes(id) && !before.has(id) ? [i + 1] : []))
}

// "Step 3 done", "Steps 3 and 4 done", "Steps 9 to 11 done".
export function doneLabel(numbers: readonly number[]): string {
  if (numbers.length === 0) return ''
  if (numbers.length === 1) return `Step ${numbers[0]} done`
  const consecutive = numbers.every((n, i) => i === 0 || n === numbers[i - 1] + 1)
  if (numbers.length === 2) return `Steps ${numbers[0]} and ${numbers[1]} done`
  if (consecutive) return `Steps ${numbers[0]} to ${numbers[numbers.length - 1]} done`
  return `Steps ${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]} done`
}

// Looking back at earlier steps. `viewing` is the step being reviewed (0-based), or null when the
// learner is on the live step. Only steps before the live one can be reviewed, and reviewing
// never changes the game: it only changes what the step card shows.

// Position of the live step in level order. When the level is finished there is none, so it is the
// length: one past the last step.
export const liveIndex = (order: readonly string[], currentId: string | null): number => (currentId === null ? order.length : Math.max(0, order.indexOf(currentId)))

// Moves one step back (-1) or forward (+1). Landing on the live step returns null.
export function moveReview(viewing: number | null, live: number, direction: -1 | 1): number | null {
  const next = Math.min(live, Math.max(0, (viewing ?? live) + direction))
  return next >= live ? null : next
}
