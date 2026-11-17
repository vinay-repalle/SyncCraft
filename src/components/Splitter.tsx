import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

// A draggable divider between two panels, like the ones in VS Code.
//
// Concept: a "splitter" sits between two panels and moves the edge between them. Drag it with a
// mouse, finger or pen, or focus it and press the arrow keys (Shift for bigger steps). Double
// click, or press Enter, to put just that panel back to its default size.
//
// It does not know about the layout. The parent says how big the panel is right now
// (`getSize`, usually by measuring it) and what to do with the new size (`onResize`).
// `invert` is for a panel whose far edge is the divider: a panel on the right or at the bottom
// grows when the divider moves left or up.

type Props = {
  orientation: 'vertical' | 'horizontal' // vertical = a tall bar that moves left and right
  label: string
  getSize: () => number
  onResize: (size: number) => void
  onReset: () => void
  min: number
  max: number
  invert?: boolean
  className?: string
}

const STEP = 16
const BIG_STEP = 64

export function Splitter({ orientation, label, getSize, onResize, onReset, min, max, invert = false, className = '' }: Props) {
  const drag = useRef<{ from: number; size: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const vertical = orientation === 'vertical'
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { from: vertical ? e.clientX : e.clientY, size: getSize() }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const delta = (vertical ? e.clientX : e.clientY) - drag.current.from
    onResize(clamp(drag.current.size + (invert ? -delta : delta)))
  }
  const stop = () => {
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') return onReset()
    const grow = vertical ? 'ArrowRight' : 'ArrowDown'
    const shrink = vertical ? 'ArrowLeft' : 'ArrowUp'
    if (e.key !== grow && e.key !== shrink) return
    e.preventDefault()
    const step = e.shiftKey ? BIG_STEP : STEP
    const delta = e.key === grow ? step : -step
    onResize(clamp(getSize() + (invert ? -delta : delta)))
  }

  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(clamp(getSize() || min))}
      tabIndex={0}
      title="Drag to resize. Double click to reset."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className={`group relative flex shrink-0 touch-none select-none items-center justify-center outline-none ${vertical ? 'cursor-col-resize' : 'cursor-row-resize'} ${className}`}
    >
      {/* Hidden at rest, so the gap between panels looks like a gap. Shown on hover, focus and drag. */}
      <span
        aria-hidden
        className={`rounded-full transition-colors group-hover:bg-accent group-focus-visible:bg-accent ${dragging ? 'bg-accent' : 'bg-transparent'} ${vertical ? 'h-full w-0.5' : 'h-0.5 w-full'}`}
      />
    </div>
  )
}
