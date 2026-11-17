import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PlayableRole } from '../content'
import { ROLE_INFO } from '../app/nav'
import { MiniTerminal } from '../components/editor/MiniTerminal'
import { EditorPane } from '../components/editor/EditorPane'
import { GitButtons } from '../components/editor/GitButtons'
import { GitGraph } from '../components/git/GitGraph'
import { Board } from '../components/jira/Board'
import { LevelMap } from '../components/LevelMap'
import { ChatPanel } from '../components/jira/ChatPanel'
import { PlayTour } from '../components/PlayTour'
import { Splitter } from '../components/Splitter'
import { PullRequestPanel } from '../components/pipeline/PullRequestPanel'
import { Pipeline } from '../components/pipeline/Pipeline'
import { MistakesReplay } from '../components/popups/MistakesReplay'
import { RecapDialog } from '../components/popups/RecapDialog'
import { SyncCheck } from '../components/popups/SyncCheck'
import { spotClass, spotProps, useNextAction } from '../components/spotlight'
import { StepCard } from '../components/StepCard'
import { PANEL } from '../components/ui'
import { useLevelStore } from '../store/levelStore'
import { zoneOf, type Zone } from '../store/nextAction'
import { useProgressStore } from '../store/progressStore'
import { LAYOUT_LIMITS, useUiStore, type LayoutKey } from '../store/uiStore'
import { useEnsureLevel } from '../store/useEnsureLevel'
import { useMediaQuery } from '../utils/useMediaQuery'
import { ViewIntro } from './ViewIntro'

type BottomTab = 'terminal' | 'pr'

// The three zones need about 1150px side by side. Below that, My view shows one at a time (Phase 9).
const WIDE = '(min-width: 1200px)'

const ZONES: { id: Zone; label: string }[] = [
  { id: 'task', label: 'Board and chat' },
  { id: 'code', label: 'Code and Git' },
  { id: 'pipeline', label: 'Pipeline' },
]

// My view: the three-zone playground from the PRD. Left: board and chat. Centre: code and
// Git. Right: the pipeline. Level 1 is playable here.
// Phase 9: on a narrower window the step card sits on top and the zones become tabs; a first-visit
// tour points at each zone; the control to use next has a dashed outline (components/spotlight.ts).
export function MyView() {
  const role = useProgressStore((s) => s.settings.role)
  const runner = useLevelStore((s) => s.runner)
  const load = useLevelStore((s) => s.load)
  const levelId = useLevelStore((s) => s.levelId)
  const playRole = useLevelStore((s) => s.playRole)
  const popup = useLevelStore((s) => s.popup)
  const completed = useProgressStore((s) => s.completed[levelId]?.[role as PlayableRole] === true)
  const prCount = useLevelStore((s) => s.snapshot?.pullRequests.length ?? 0)
  const [tab, setTab] = useState<BottomTab>('terminal')
  const graphOpen = useUiStore((s) => s.gitGraphOpen)
  const zone = useUiStore((s) => s.playZone)
  const setZone = useUiStore((s) => s.setPlayZone)
  const tourDone = useUiStore((s) => s.tourDone)
  const tourStep = useUiStore((s) => s.tourStep)
  const startTour = useUiStore((s) => s.startTour)
  const wide = useMediaQuery(WIDE)
  // Panel sizes set by the dividers (wide layout only), and the boxes they measure.
  const layout = useUiStore((s) => s.layout)
  const setLayout = useUiStore((s) => s.setLayout)
  const gridRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<HTMLElement>(null)
  const pipelineRef = useRef<HTMLElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<HTMLDivElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const next = useNextAction()
  const playable = role === 'frontend' || role === 'backend'

  // Start Level 1 the first time My view opens. The run is kept when you switch tabs.
  useEnsureLevel()

  // Switching between Frontend and Backend developer in the role bar starts the same level from
  // the other seat. Observe-only roles do not change the run.
  useEffect(() => {
    if (runner && playable && role !== playRole) load(levelId, { role })
  }, [role, playRole, runner, levelId, load, playable])

  // Show the pull request page as soon as one exists.
  useEffect(() => {
    if (prCount > 0) setTab('pr')
  }, [prCount])

  // The tour starts once, the first time the level's intro popup is closed.
  useEffect(() => {
    if (playable && runner && !popup && !tourDone && tourStep === null) startTour()
  }, [playable, runner, popup, tourDone, tourStep, startTour])

  if (!playable) {
    const info = ROLE_INFO.find((r) => r.id === role)!
    return (
      <ViewIntro
        title="My view"
        description={`${info.label} is observe only in v1. Choose Frontend developer or Backend developer in the role bar to play a level. Team view and Pipeline view show how a level runs.`}
      />
    )
  }

  const narrow = !wide
  // On a narrow window only the chosen zone shows. The others stay mounted (hidden), so the 3D
  // scene and the editor keep their state. A zone fades in each time it is shown.
  const zoneProps = (id: Zone) =>
    narrow ? { id: `zone-${id}`, role: 'tabpanel', hidden: zone !== id, 'data-zone': id } : { 'data-zone': id }
  // Narrow heights: board and chat share a fixed height and scroll inside, the code zone grows with
  // its content (the page scrolls), and the pipeline gets room for the scene.
  // `relative` makes each zone the box that positioned pieces inside it (screen-reader-only labels,
  // term cards) are placed in, so they scroll with the zone instead of stretching the page.
  const zoneMotion = narrow ? ' relative motion-fade' : ' relative'
  const spotPrTab = next?.kind === 'merge' && tab !== 'pr'

  // Dividers. Each reports the panel's size when a drag starts (`size`), saves a new one (`resize`)
  // and goes back to the default (`reset`). `room` keeps the middle panels from being squeezed shut.
  const size = (el: HTMLElement | null, axis: 'width' | 'height') => (el ? el.getBoundingClientRect()[axis] : 0)
  const divider = (key: LayoutKey, el: () => HTMLElement | null, axis: 'width' | 'height', room: () => number) => ({
    getSize: () => size(el(), axis),
    onResize: (n: number) => setLayout(key, Math.min(n, room())),
    onReset: () => setLayout(key, null),
    min: LAYOUT_LIMITS[key].min,
    max: LAYOUT_LIMITS[key].max,
  })
  const COLUMN_MIN = 420 // the middle column never gets narrower than this
  const gridRoom = (other: () => HTMLElement | null) => () => size(gridRef.current, 'width') - size(other(), 'width') - COLUMN_MIN - 32

  const task = (
    <section ref={taskRef} aria-label="Board and chat" {...zoneProps('task')} className={`${PANEL} p-4${narrow ? ' h-[40rem]' : ''}${zoneMotion}`}>
      <header>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-body font-medium">Levels</h2>
          {completed && <span className="text-meta text-pass">Completed</span>}
        </div>
        <LevelMap role={role} />
      </header>
      <div className="mt-3 min-h-0 flex-[3] overflow-y-auto">
        <Board />
      </div>
      {wide && (
        <Splitter
          orientation="horizontal"
          label="Resize Team chat"
          invert
          className="h-3"
          {...divider('chat', () => chatRef.current, 'height', () => size(taskRef.current, 'height') - 220)}
        />
      )}
      <div
        ref={chatRef}
        style={wide && layout.chat ? { height: layout.chat } : undefined}
        className={`flex min-h-0 flex-col border-t border-line pt-3 ${wide && layout.chat ? 'flex-none' : 'flex-[2]'}${wide ? '' : ' mt-3'}`}
      >
        <h2 className="mb-2 text-body font-medium">Team chat</h2>
        <ChatPanel />
      </div>
    </section>
  )

  const outputBox = (
    // One height for both tabs, so the box does not jump when the pull request opens. On a wide
    // window the default height follows the window height and a divider above it changes it.
    <div
      ref={outputRef}
      style={wide && layout.output ? { height: layout.output } : undefined}
      className={`flex shrink-0 flex-col rounded-tag border border-line ${wide && layout.output ? '' : wide ? 'h-[clamp(7rem,19vh,14rem)]' : 'h-72'}`}
    >
      <div role="tablist" aria-label="Output" className="flex border-b border-line bg-raised">
        {(['terminal', 'pr'] as const).map((id) => {
          const spot = id === 'pr' && spotPrTab
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              {...spotProps(spot)}
              className={`-mb-px h-8 border-b-2 px-3 text-caption transition-colors ${
                tab === id ? 'border-accent bg-card font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink'
              }${spotClass(spot)}`}
            >
              {id === 'terminal' ? 'Terminal' : 'Pull request'}
            </button>
          )
        })}
      </div>
      {/* Keyed by the tab, so the new content fades in once when you switch. */}
      <div key={tab} className="motion-fade flex min-h-0 flex-1 flex-col p-3">
        {tab === 'terminal' ? <MiniTerminal /> : <PullRequestPanel />}
      </div>
    </div>
  )

  // Wide: the zone never scrolls. The step card gives up room first (it scrolls inside itself), then
  // the editor, so the Git buttons are always on screen. The output box is under a divider.
  // Narrow: as before, the zone grows with its content and the page scrolls.
  const code = wide ? (
    <section aria-label="Code and Git" {...zoneProps('code')} className={`${PANEL} gap-3 overflow-hidden p-4${zoneMotion}`}>
      <div className="min-h-0 shrink overflow-y-auto">
        <StepCard />
      </div>
      <div className="flex min-h-36 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorPane />
        </div>
        {graphOpen && (
          <>
            <Splitter
              orientation="vertical"
              label="Resize Git graph"
              invert
              className="w-3"
              {...divider('graph', () => graphRef.current, 'width', () => size(graphRef.current?.parentElement ?? null, 'width') - 240)}
            />
            <div ref={graphRef} style={{ width: layout.graph ?? 232 }} className="flex shrink-0">
              <GitGraph />
            </div>
          </>
        )}
      </div>
      <GitButtons />
      <Splitter
        orientation="horizontal"
        label="Resize Terminal and Pull request"
        invert
        className="-my-3 h-3"
        {...divider('output', () => outputRef.current, 'height', () => size(outputRef.current?.parentElement ?? null, 'height') - 340)}
      />
      {outputBox}
    </section>
  ) : (
    <section aria-label="Code and Git" {...zoneProps('code')} className={`${PANEL} gap-3 p-4${zoneMotion}`}>
      {/* The editor, with the Git graph beside it when it is open (Phase 7a). On a phone-width
          window the graph goes under the editor instead. */}
      <div className={`flex flex-1 flex-col gap-3 sm:flex-row ${graphOpen ? 'min-h-[30rem]' : 'min-h-56'}`}>
        <div className="flex min-h-56 min-w-0 flex-1 flex-col">
          <EditorPane />
        </div>
        {graphOpen && (
          <div className="flex max-h-72 sm:max-h-none">
            <GitGraph />
          </div>
        )}
      </div>
      <GitButtons />
      {outputBox}
    </section>
  )

  const pipeline = (
    <section ref={pipelineRef} aria-label="Pipeline" {...zoneProps('pipeline')} className={`${PANEL} p-4${narrow ? ' h-[32rem]' : ''}${zoneMotion}`}>
      <h2 className="text-body font-medium">Pipeline</h2>
      <p className="mb-3 mt-1 text-caption text-ink-2">Where your change is on its way to customers.</p>
      <div className="min-h-0 flex-1">
        <Pipeline withList />
      </div>
    </section>
  )

  const popups: ReactNode = (
    <>
      <RecapDialog />
      <SyncCheck />
      <MistakesReplay />
      <PlayTour narrow={narrow} />
    </>
  )

  if (wide) {
    // Three columns with a divider in each gap. A column left at its default keeps its flexible
    // width; a dragged one gets pixels (capped to a share of the window, so a small window never
    // overflows).
    const columns = [
      layout.left ? `min(${layout.left}px, 38vw)` : 'minmax(280px, 0.8fr)',
      '16px',
      `minmax(${COLUMN_MIN}px, 1.5fr)`,
      '16px',
      layout.right ? `min(${layout.right}px, 45vw)` : 'minmax(340px, 1fr)',
    ].join(' ')
    return (
      <div className="flex h-full flex-col">
        <h1 className="sr-only">My view</h1>
        <div ref={gridRef} style={{ gridTemplateColumns: columns }} className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)]">
          {task}
          <Splitter orientation="vertical" label="Resize board and chat" {...divider('left', () => taskRef.current, 'width', gridRoom(() => pipelineRef.current))} />
          {code}
          <Splitter orientation="vertical" label="Resize pipeline" invert {...divider('right', () => pipelineRef.current, 'width', gridRoom(() => taskRef.current))} />
          {pipeline}
        </div>
        {popups}
      </div>
    )
  }

  // Narrow: the task on top, then one zone at a time. A tab says "Next" when the control to use
  // next is in that zone and another zone is showing.
  const nextZone = next ? zoneOf(next) : null
  return (
    <div className="flex min-h-full flex-col gap-3">
      <h1 className="sr-only">My view</h1>
      <StepCard />
      <div role="tablist" aria-label="Zones" className="flex gap-0.5 self-start overflow-x-auto rounded-control border border-line bg-raised p-0.5">
        {ZONES.map(({ id, label }) => {
          const active = zone === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`zone-${id}`}
              onClick={() => setZone(id)}
              className={`flex h-7 items-center gap-1.5 whitespace-nowrap rounded-tag px-3 text-caption transition-colors ${
                active ? 'bg-card font-medium text-ink shadow-small' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {label}
              {!active && nextZone === id && <span className="text-meta text-accent">Next</span>}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col">
        {task}
        {code}
        {pipeline}
      </div>
      {popups}
    </div>
  )
}
