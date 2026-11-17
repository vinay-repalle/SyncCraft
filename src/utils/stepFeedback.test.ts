import { describe, expect, it } from 'vitest'
import { doneLabel, justCompleted, liveIndex, moveReview } from './stepFeedback'

const ORDER = ['a', 'b', 'c', 'd', 'e']

describe('justCompleted', () => {
  it('finds the steps that are new since last time, as step numbers', () => {
    expect(justCompleted(['a'], ['a', 'b'], ORDER)).toEqual([2])
    expect(justCompleted(['a'], ['a', 'b', 'c', 'd'], ORDER)).toEqual([2, 3, 4])
  })

  it('reports nothing right after a level loads, or when nothing changed', () => {
    expect(justCompleted(null, ['a', 'b'], ORDER)).toEqual([])
    expect(justCompleted(['a'], ['a'], ORDER)).toEqual([])
  })
})

describe('doneLabel', () => {
  it('reads naturally for one, two, a run, or scattered steps', () => {
    expect(doneLabel([])).toBe('')
    expect(doneLabel([3])).toBe('Step 3 done')
    expect(doneLabel([3, 4])).toBe('Steps 3 and 4 done')
    expect(doneLabel([9, 10, 11])).toBe('Steps 9 to 11 done')
    expect(doneLabel([2, 5, 7])).toBe('Steps 2, 5 and 7 done')
  })
})

describe('looking back at steps', () => {
  const order = ['a', 'b', 'c', 'd']

  it('finds the live step, or one past the end when the level is done', () => {
    expect(liveIndex(order, 'c')).toBe(2)
    expect(liveIndex(order, null)).toBe(4)
  })

  it('goes back one step at a time and stops at the first', () => {
    expect(moveReview(null, 2, -1)).toBe(1)
    expect(moveReview(1, 2, -1)).toBe(0)
    expect(moveReview(0, 2, -1)).toBe(0)
  })

  it('goes forward and lands on the live step as null', () => {
    expect(moveReview(0, 2, 1)).toBe(1)
    expect(moveReview(1, 2, 1)).toBeNull()
    expect(moveReview(null, 2, 1)).toBeNull()
  })

  it('does nothing on the very first step', () => {
    expect(moveReview(null, 0, -1)).toBeNull()
  })
})
