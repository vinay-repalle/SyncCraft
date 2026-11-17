import { BookOpen, Ellipsis, IdCard } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BUTTON } from '../components/ui'
import { ProgressTransfer } from './ProgressTransfer'

type Props = { termCount: number; onCheatSheet: () => void; onProgressCard: () => void }

const ITEM = 'flex h-8 w-full items-center gap-2 whitespace-nowrap rounded-tag px-2 text-body text-ink transition-colors hover:bg-raised'

// The tools a new player does not need on day one: the Cheat sheet, the Progress card, and saving
// or loading progress. They live behind one "More" button, so the header is easy to read at first.
// A "disclosure": a button that shows or hides a panel. It closes on Escape or a click outside.
export function MoreMenu({ termCount, onCheatSheet, onProgressCard }: Props) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Opening a dialog closes the menu first, so the dialog gets the focus.
  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div ref={box} className="relative">
      <button ref={button} type="button" className={BUTTON} aria-expanded={open} aria-controls="more-menu" onClick={() => setOpen((o) => !o)}>
        <Ellipsis size={16} strokeWidth={1.5} aria-hidden />
        More
      </button>
      {open && (
        <div id="more-menu" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-control border border-line bg-card p-1 shadow-small">
          <button type="button" className={ITEM} onClick={choose(onCheatSheet)}>
            <BookOpen size={16} strokeWidth={1.5} aria-hidden />
            Cheat sheet
            <span className="ml-auto text-ink-3 tabular-nums">{termCount}</span>
          </button>
          <button type="button" className={ITEM} onClick={choose(onProgressCard)}>
            <IdCard size={16} strokeWidth={1.5} aria-hidden />
            Progress card
          </button>
          <div className="my-1 border-t border-line" />
          <ProgressTransfer />
        </div>
      )}
    </div>
  )
}
