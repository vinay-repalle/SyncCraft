import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ViewId } from '../app/nav'
import type { Zone } from './nextAction'

// Screen state that is not progress: which view is open, which Field Guide article is showing,
// whether the Git graph panel is open, the first-visit tour (Phase 9) and, on narrow screens,
// which zone of My view is showing (Phase 9).
// Keeping it in a store (instead of inside App) lets any highlighted term open its article from anywhere.
//
// Only `gitGraphOpen` (Phase 7a), `tourDone` (Phase 9) and the panel sizes (`layout`) are saved, under their own localStorage
// key, so they are remembered across reloads but are not part of the progress file. The view and
// article are not saved, so a reload starts on My view.
// Sizes of the My view panels in pixels, set by dragging the dividers. null means "use the
// default size", so "Default view" only has to set everything back to null.
export type Layout = {
  left: number | null // width of the board and chat column
  right: number | null // width of the pipeline column
  graph: number | null // width of the Git graph beside the editor
  output: number | null // height of the Terminal / Pull request box
  chat: number | null // height of Team chat under the board
}
export type LayoutKey = keyof Layout

export const DEFAULT_LAYOUT: Layout = { left: null, right: null, graph: null, output: null, chat: null }

// Smallest and largest size a divider can give each panel, so none can be dragged shut.
export const LAYOUT_LIMITS: Record<LayoutKey, { min: number; max: number }> = {
  left: { min: 240, max: 560 },
  right: { min: 300, max: 720 },
  graph: { min: 160, max: 520 },
  output: { min: 120, max: 560 },
  chat: { min: 120, max: 520 },
}

export const isDefaultLayout = (layout: Layout): boolean => (Object.keys(DEFAULT_LAYOUT) as LayoutKey[]).every((k) => layout[k] === null)

type UiState = {
  view: ViewId
  guideSlug: string | null
  gitGraphOpen: boolean
  // The three-card tour of My view. `tourStep` is the card showing (0 to TOUR_LENGTH - 1), or null.
  tourDone: boolean
  tourStep: number | null
  // Below the wide layout, My view shows one zone at a time.
  playZone: Zone
  layout: Layout
  setLayout: (key: LayoutKey, size: number | null) => void
  resetLayout: () => void
  setView: (view: ViewId) => void
  openGuide: (slug: string) => void
  closeGuide: () => void
  toggleGitGraph: () => void
  startTour: () => void
  nextTourStep: () => void
  endTour: () => void
  setPlayZone: (zone: Zone) => void
}

export const TOUR_LENGTH = 3

export const UI_STORAGE_KEY = 'synccraft-ui'

// localStorage can be missing (tests, some private windows) or throw (storage blocked or full).
// Every call is wrapped, so the worst case is "not remembered", never a crash.
export const safeLocalStorage: StateStorage = {
  getItem: (key) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      // Not remembered this time. The panel still works.
    }
  },
  removeItem: (key) => {
    try {
      globalThis.localStorage?.removeItem(key)
    } catch {
      // Nothing to do.
    }
  },
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'my',
      guideSlug: null,
      gitGraphOpen: true,
      tourDone: false,
      tourStep: null,
      playZone: 'code',
      layout: DEFAULT_LAYOUT,
      setLayout: (key, size) =>
        set((s) => ({ layout: { ...s.layout, [key]: size === null ? null : Math.round(Math.min(LAYOUT_LIMITS[key].max, Math.max(LAYOUT_LIMITS[key].min, size))) } })),
      resetLayout: () => set({ layout: DEFAULT_LAYOUT }),
      setView: (view) => set({ view }),
      openGuide: (guideSlug) => set({ view: 'guide', guideSlug }),
      closeGuide: () => set({ guideSlug: null }),
      toggleGitGraph: () => set((s) => ({ gitGraphOpen: !s.gitGraphOpen })),
      startTour: () => set({ view: 'my', tourStep: 0 }),
      // The last card's "Start playing" ends the tour, the same as skipping it.
      nextTourStep: () =>
        set((s) => (s.tourStep === null || s.tourStep + 1 >= TOUR_LENGTH ? { tourStep: null, tourDone: true } : { tourStep: s.tourStep + 1 })),
      endTour: () => set({ tourStep: null, tourDone: true }),
      setPlayZone: (playZone) => set({ playZone }),
    }),
    {
      name: UI_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (s) => ({ gitGraphOpen: s.gitGraphOpen, tourDone: s.tourDone, layout: s.layout }),
      // Accept only real booleans from storage; anything else keeps the default.
      merge: (saved, current) => {
        const { gitGraphOpen, tourDone, layout } = (saved ?? {}) as { gitGraphOpen?: unknown; tourDone?: unknown; layout?: Record<string, unknown> }
        // Keep each saved size only if it is a real number inside its limits.
        const sizes = Object.fromEntries(
          (Object.keys(DEFAULT_LAYOUT) as LayoutKey[]).map((k) => {
            const v = layout?.[k]
            return [k, typeof v === 'number' && Number.isFinite(v) && v >= LAYOUT_LIMITS[k].min && v <= LAYOUT_LIMITS[k].max ? v : null]
          }),
        ) as Layout
        return {
          ...current,
          layout: sizes,
          ...(typeof gitGraphOpen === 'boolean' ? { gitGraphOpen } : {}),
          ...(typeof tourDone === 'boolean' ? { tourDone } : {}),
        }
      },
    },
  ),
)
