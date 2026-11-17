import { LayoutPanelLeft } from 'lucide-react'
import { useProgressStore } from '../store/progressStore'
import { isDefaultLayout, useUiStore } from '../store/uiStore'
import { ROLE_INFO } from './nav'

// Concept: "layout" is how big each panel of My view is. Dragging the lines between panels changes
// it, and this button puts every panel back to its starting size. Only the three-column layout
// (1200px and wider) has draggable panels, so the button shows only there, and only in My view.
function DefaultView() {
  const layout = useUiStore((s) => s.layout)
  const resetLayout = useUiStore((s) => s.resetLayout)
  return (
    <div className="ml-auto hidden items-center gap-3 min-[1200px]:flex">
      <span className="text-meta text-ink-3">Drag the lines between panels to resize them</span>
      <button
        type="button"
        onClick={resetLayout}
        disabled={isDefaultLayout(layout)}
        title="Put every panel back to its default size"
        className="flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-control border border-line bg-card px-3 text-body text-ink transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:text-ink-3 disabled:hover:bg-card"
      >
        <LayoutPanelLeft size={16} strokeWidth={1.5} aria-hidden />
        Default view
      </button>
    </div>
  )
}

export function RoleBar() {
  const role = useProgressStore((s) => s.settings.role)
  const setRole = useProgressStore((s) => s.setRole)
  const inMyView = useUiStore((s) => s.view === 'my')

  const groups = [
    { label: 'Play', roles: ROLE_INFO.filter((r) => r.playable) },
    { label: 'Observe only', roles: ROLE_INFO.filter((r) => !r.playable) },
  ]

  return (
    // Phase 9: on a narrow window the bar wraps onto more rows instead of squeezing the role names.
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-2 lg:px-6">
      <div role="group" aria-label="Role" className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {groups.map((group, i) => (
          <div key={group.label} className="flex flex-wrap items-center gap-2">
            {i > 0 && <span aria-hidden className="mr-4 hidden h-5 w-px bg-line md:block" />}
            <span className="mr-1 whitespace-nowrap text-meta text-ink-3">{group.label}</span>
            {group.roles.map(({ id, label }) => {
              const active = role === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRole(id)}
                  className={`h-8 whitespace-nowrap rounded-control border px-3 text-body transition-colors ${
                    active
                      ? 'border-accent bg-card font-medium text-ink'
                      : 'border-transparent text-ink-2 hover:bg-raised hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      {inMyView && (role === 'frontend' || role === 'backend') && <DefaultView />}
    </div>
  )
}
