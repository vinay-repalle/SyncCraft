import { ArrowRight, Award, Check, ChevronLeft, ChevronRight, CircleAlert, FastForward, Lightbulb, LocateFixed } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ROLE_INFO } from '../app/nav'
import { LEVEL_IDS, type PlayableRole } from '../content'
import { COLUMNS } from '../engine/jiraSim'
import type { LevelRunner } from '../engine/levelRunner'
import { useCurrentStep, useLevelStore } from '../store/levelStore'
import { describeAction, editTarget } from '../store/nextAction'
import { useProgressStore } from '../store/progressStore'
import { doneLabel, justCompleted, liveIndex, moveReview } from '../utils/stepFeedback'
import { FirstTimeCard } from './jargon/TermCard'
import { JargonText } from './jargon/JargonText'
import { showNextAction, useNextAction } from './spotlight'
import { BUTTON_PRIMARY, PANEL_BUTTON } from './ui'

const statusLabel = (status: string) => COLUMNS.find((c) => c.id === status)?.label ?? status

// The task: what to do now, a hint, and Skip & Auto-Fill. Sits above the editor.
export function StepCard() {
  const runner = useLevelStore((s) => s.runner)
  const snapshot = useLevelStore((s) => s.snapshot)
  const notice = useLevelStore((s) => s.notice)
  const noticeSeq = useLevelStore((s) => s.noticeSeq)
  const popup = useLevelStore((s) => s.popup)
  const playRole = useLevelStore((s) => s.playRole)
  const completed = useProgressStore((s) => s.completed)
  const next = useNextAction()
  const autoFill = useLevelStore((s) => s.autoFill)
  const openReplay = useLevelStore((s) => s.openReplay)
  const restart = useLevelStore((s) => s.restart)
  const load = useLevelStore((s) => s.load)
  const levelId = useLevelStore((s) => s.levelId)
  const step = useCurrentStep()
  // Remember which step's hint is open, so it closes by itself when the step changes.
  const [hintFor, setHintFor] = useState<string | null>(null)
  // Looking back: the earlier step being read (0-based), or null on the live step. Read-only.
  const [viewing, setViewing] = useState<number | null>(null)
  const stepId = step?.id
  // A new level, seat or live step brings the learner back to the live step.
  useEffect(() => setViewing(null), [runner, stepId])

  // Phase 7e: when steps complete, their bars grow in and a short "Step N done" line rises in,
  // once. `seen` remembers what was done last time; it resets when another level or seat loads.
  const seen = useRef<{ runner: LevelRunner; ids: string[] } | null>(null)
  const [done, setDone] = useState<{ key: number; label: string; ids: string[] } | null>(null)
  const completedIds = snapshot?.completedStepIds
  useEffect(() => {
    if (!runner || !completedIds) return
    const prev = seen.current?.runner === runner ? seen.current.ids : null
    seen.current = { runner, ids: completedIds }
    if (prev === null) {
      setDone(null)
      return
    }
    const order = runner.level.steps.map((s) => s.id)
    const numbers = justCompleted(prev, completedIds, order)
    if (numbers.length) setDone((d) => ({ key: (d?.key ?? 0) + 1, label: doneLabel(numbers), ids: numbers.map((n) => order[n - 1]) }))
  }, [runner, completedIds])

  if (!runner || !snapshot) return null

  const total = runner.level.steps.length
  const doneCount = snapshot.completedStepIds.length
  const levelsDone = LEVEL_IDS.filter((id) => completed[id]?.[playRole as PlayableRole]).length
  const order = runner.level.steps.map((x) => x.id)
  const live = liveIndex(order, step?.id ?? null)
  const reviewing = viewing !== null && viewing < live ? runner.level.steps[viewing] : null
  const roleLabel = (id: string) => ROLE_INFO.find((r) => r.id === id)?.label

  return (
    <div className="rounded-tag border border-line bg-raised p-4">
      <ol aria-label={`${doneCount} of ${total} steps done`} className="mb-3 flex gap-1">
        {runner.level.steps.map((s, i) => {
          const bar = `h-1 w-full rounded-tag ${i === viewing ? 'bg-ink' : snapshot.completedStepIds.includes(s.id) ? 'bg-accent' : s.id === step?.id ? 'bg-ink-3' : 'bg-line'} ${done?.ids.includes(s.id) ? 'motion-grow-x' : ''}`
          return (
            <li key={s.id} className="flex-1">
              {i < live ? (
                // An earlier step: a taller click target around the thin bar, to look back at it.
                <button type="button" aria-label={`Look back at step ${i + 1}`} aria-current={i === viewing || undefined} title={`Step ${i + 1}`} onClick={() => setViewing(i === viewing ? null : i)} className="flex h-4 w-full items-center">
                  <span className={bar} />
                </button>
              ) : (
                <div className="flex h-4 items-center">
                  <span className={bar} />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {done && (
        // Keyed by each completion, so the line rises in once per completion and then stays still.
        <p key={done.key} role="status" className="motion-rise mb-2 flex items-center gap-1 text-meta text-pass">
          <Check size={16} strokeWidth={1.5} aria-hidden />
          {done.label}
        </p>
      )}

      {/* Back and forward through the steps you have done. Forward is off on the live step. */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-meta text-ink-3">
          {reviewing
            ? `Step ${viewing! + 1} of ${total} · Done · ${roleLabel(reviewing.role)}`
            : !step
              ? `All ${total} steps done`
              : `Step ${doneCount + 1} of ${total}${step.auto ? ' · Runs on its own' : ''} · ${roleLabel(step.role)}`}
        </p>
        <div className="flex shrink-0 items-center">
          {[-1, 1].map((dir) => {
            const disabled = dir === -1 ? live === 0 || viewing === 0 : viewing === null
            const Icon = dir === -1 ? ChevronLeft : ChevronRight
            return (
              <button
                key={dir}
                type="button"
                disabled={disabled}
                aria-label={dir === -1 ? 'Previous step' : 'Next step'}
                title={dir === -1 ? 'Look at the step before' : 'Look at the step after'}
                onClick={() => setViewing(moveReview(viewing, live, dir as -1 | 1))}
                className="flex h-6 w-6 items-center justify-center rounded-tag text-ink-2 transition-colors hover:bg-card hover:text-ink disabled:cursor-not-allowed disabled:text-ink-3 disabled:hover:bg-transparent"
              >
                <Icon size={16} strokeWidth={1.5} aria-hidden />
              </button>
            )
          })}
        </div>
      </div>

      {reviewing ? (
        // Read-only: what an earlier step asked, and one answer that worked. Nothing here changes the game.
        <>
          <p className="mt-1 text-lead text-ink">
            <JargonText text={reviewing.prompt} terms={reviewing.terms} />
          </p>
          <p className="mt-2 flex items-center gap-1 text-caption text-pass">
            <Check size={16} strokeWidth={1.5} aria-hidden />
            Done. You can read it again, but nothing here changes your progress.
          </p>
          {reviewing.kind === 'git' && reviewing.autoFill && reviewing.autoFill.length < 120 && (
            <p className="mt-2 text-caption text-ink-2">
              One command that works: <code className="font-mono text-ink">{reviewing.autoFill}</code>
            </p>
          )}
          <div className="mt-3">
            <button type="button" className={PANEL_BUTTON} onClick={() => setViewing(null)}>
              {step ? `Back to step ${doneCount + 1}` : 'Back to level complete'}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </>
      ) : !step ? (
        // Phase 9: the level-complete moment. The Mistakes replay opens first, so the moment waits
        // behind it and plays when the replay closes (the new key remounts it). It plays once:
        // the medal pops, the line rises, then the buttons. Under reduced motion it just shows.
        <div key={popup ? 'behind' : 'shown'}>
          <p className="flex items-center gap-2 text-lead font-medium">
            <Award size={18} strokeWidth={1.5} className="motion-pop text-accent" aria-hidden />
            Level complete
          </p>
          <p className="motion-rise mt-1 text-body text-ink-2" style={{ '--delay': '120ms' } as CSSProperties}>
            Your change is live. <span className="tabular-nums">{levelsDone} of {LEVEL_IDS.length}</span> levels done in this seat. See what you did well and what to watch for next time.
          </p>
          <div className="motion-rise mt-3 flex flex-wrap gap-2" style={{ '--delay': '240ms' } as CSSProperties}>
            <button type="button" className={BUTTON_PRIMARY} onClick={openReplay}>
              Show replay
            </button>
            <button type="button" className={PANEL_BUTTON} onClick={restart}>
              Play again
            </button>
            {LEVEL_IDS.includes(levelId + 1) && (
              <button type="button" className={PANEL_BUTTON} onClick={() => load(levelId + 1)}>
                Next level
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 text-lead text-ink">
            <JargonText text={step.prompt} terms={step.terms} />
          </p>

          {/* Phase 9: where to do it, in words, and a jump to it. The same control has a dashed outline. */}
          {next && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-2">
              <span>
                <span className="font-medium text-ink">Next:</span> {describeAction(next, statusLabel, editTarget(step))}
              </span>
              <button
                type="button"
                onClick={() => showNextAction(next)}
                className="flex h-6 items-center gap-1 rounded-tag px-1.5 text-caption text-accent transition-colors hover:bg-card"
              >
                <LocateFixed size={16} strokeWidth={1.5} aria-hidden />
                Show me
              </button>
            </p>
          )}
          {/* A step that runs on its own has no control to use. Say so, so the learner does not wait for a button. */}
          {step.auto && !next && (
            <p className="mt-2 text-caption text-ink-2">Nothing to do here. This runs by itself. Watch the Pipeline panel, and the next step starts when it finishes.</p>
          )}
          {hintFor === step.id && step.hint && <p className="mt-2 text-caption text-ink-2">{step.hint}</p>}
          {/* Phase 9: keyed by the notice counter, so each new warning shakes once, even a repeat. */}
          {notice && (
            <p key={noticeSeq} role="alert" className="motion-shake mt-2 flex items-start gap-1.5 text-caption text-fail">
              <CircleAlert size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
              {notice}
            </p>
          )}
          {/* Tests that run on their own can fail. Say what to do, since the learner has no button for it. */}
          {step.auto?.type === 'runTests' && snapshot.lastTestReport && !snapshot.lastTestReport.passed && (
            <p className="mt-2 text-caption text-fail">The tests failed. Open the Pull request tab, read the log, fix the code, commit and push again. The tests run again by themselves.</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {step.hint && (
              <button type="button" className={PANEL_BUTTON} onClick={() => setHintFor(hintFor === step.id ? null : step.id)}>
                <Lightbulb size={16} strokeWidth={1.5} />
                {hintFor === step.id ? 'Hide hint' : 'Show hint'}
              </button>
            )}
            {!step.auto && (
              <button type="button" className={PANEL_BUTTON} onClick={autoFill}>
                <FastForward size={16} strokeWidth={1.5} />
                Skip and auto-fill
              </button>
            )}
          </div>
          <FirstTimeCard termIds={step.terms ?? []} />
        </>
      )}
    </div>
  )
}
