import { CircleHelp } from 'lucide-react'
import { useState } from 'react'
import { CheatSheet } from '../components/jargon/CheatSheet'
import { ProgressCardDialog } from '../components/popups/ProgressCardDialog'
import { HOW_TO_PLAY_SLUG } from '../content/guides'
import { useProgressStore } from '../store/progressStore'
import { useUiStore } from '../store/uiStore'
import { JargonModeSwitch } from './JargonModeSwitch'
import { Link } from './Link'
import { MoreMenu } from './MoreMenu'
import { VIEWS, type ViewId } from './nav'
import { ThemeSwitch } from './ThemeSwitch'

type Props = { view: ViewId; onViewChange: (view: ViewId) => void }

export function Header({ view, onViewChange }: Props) {
  const [cheatOpen, setCheatOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const termCount = useProgressStore((s) => s.seenTerms.length)
  const openGuide = useUiStore((s) => s.openGuide)

  return (
    // Phase 9: below 768px the view tabs move to their own row under the name and tools.
    <header className="flex shrink-0 flex-wrap items-stretch justify-between gap-x-6 border-b border-line px-4 lg:px-6">
      {/* The name leads back to the landing page. */}
      <Link href="/" className="flex h-14 items-center text-lead font-medium">
        SyncCraft
      </Link>
      <nav
        aria-label="Views"
        className="order-last -mx-4 flex h-11 w-[calc(100%+2rem)] items-stretch gap-6 overflow-x-auto px-4 md:order-none md:mx-0 md:h-14 md:w-auto md:flex-1 md:overflow-visible md:px-0 lg:ml-4"
      >
        {VIEWS.map(({ id, label }) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onViewChange(id)}
              className={`-mb-px flex items-center whitespace-nowrap border-b-2 text-body transition-colors ${
                active ? 'border-accent font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          )
        })}
      </nav>
      <div className="flex min-h-14 flex-wrap items-center justify-end gap-2 py-2 lg:gap-4">
        <JargonModeSwitch />
        {/* Cheat sheet, Progress card and Export / Import progress sit behind More, so a new player sees fewer controls. */}
        <MoreMenu termCount={termCount} onCheatSheet={() => setCheatOpen(true)} onProgressCard={() => setCardOpen(true)} />
        {/* Phase 8: How to play is the first Field guide article. Phase 9: the ? key opens it too. */}
        <button
          type="button"
          aria-label="How to play"
          aria-keyshortcuts="Shift+?"
          title="How to play (?)"
          onClick={() => openGuide(HOW_TO_PLAY_SLUG)}
          className="flex size-8 items-center justify-center rounded-control border border-line bg-card text-ink-2 transition-colors hover:bg-raised hover:text-ink"
        >
          <CircleHelp size={16} strokeWidth={1.5} />
        </button>
        <ThemeSwitch />
      </div>
      <CheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />
      <ProgressCardDialog open={cardOpen} onClose={() => setCardOpen(false)} />
    </header>
  )
}
