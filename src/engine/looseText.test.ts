import { describe, expect, it } from 'vitest'
import { loose, looseIncludes } from './looseText'

describe('looseIncludes', () => {
  it('ignores spaces around punctuation', () => {
    expect(looseIncludes('{ "estimatedMinutes":"number" }', '"estimatedMinutes": "number"')).toBe(true)
    expect(looseIncludes('"estimatedMinutes" :   25', '"estimatedMinutes": 25')).toBe(true)
    expect(looseIncludes('<p>Total: ${subtotal+deliveryFee}</p>', '<p>Total: ${subtotal + deliveryFee}</p>')).toBe(true)
  })

  it('ignores line breaks and runs of spaces', () => {
    expect(looseIncludes('(subtotal\n  + deliveryFee)  .toFixed(2)', '(subtotal + deliveryFee).toFixed(2)')).toBe(true)
  })

  it('keeps the space between two words', () => {
    expect(looseIncludes('Placeorder', 'Place order')).toBe(false)
    expect(looseIncludes('Place  order', 'Place order')).toBe(true)
  })

  it('still fails when the text really differs', () => {
    expect(looseIncludes('"estimatedMinutes": "string"', '"estimatedMinutes": "number"')).toBe(false)
    expect(looseIncludes('"estimatedMinutesMax": "number"', '"estimatedMinutes"')).toBe(false)
  })

  it('normalises both sides the same way', () => {
    expect(loose('  a :  b ')).toBe(loose('a:b'))
  })
})
