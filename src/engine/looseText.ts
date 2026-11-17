// Spacing-tolerant text matching for the game's file checks and tests.
//
// A learner who types "estimatedMinutes":"number" has written the same thing as
// "estimatedMinutes": "number". Real tools (JSON parsers, JavaScript) do not care about that
// space either, so the game should not fail a step over it. This file turns text into a
// "loose" form: runs of spaces and line breaks become one space, and a space next to
// punctuation is dropped. A space between two words stays, so "Placeorder" still does not
// match "Place order".
//
// Plain logic, no React, so the engine and the tests can both use it.

export const loose = (text: string): string => text.replace(/\s+/g, ' ').replace(/ ?([^\w ]) ?/g, '$1').trim()

// Does `text` contain `needle`, ignoring spacing differences?
export const looseIncludes = (text: string, needle: string): boolean => loose(text).includes(loose(needle))
