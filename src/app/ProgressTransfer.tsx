import { Download, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { selectProgress, useProgressStore } from '../store/progressStore'
import { downloadProgressFile, parseProgressFile } from '../utils/progressFile'

type Message = { kind: 'ok' | 'error'; text: string }

// Rows in the More menu (Header). The menu stays open while a file is picked, so the file input
// below is still mounted when its change event arrives.
const ITEM = 'flex h-8 w-full items-center gap-2 whitespace-nowrap rounded-tag px-2 text-body text-ink transition-colors hover:bg-raised'

export function ProgressTransfer() {
  const replaceProgress = useProgressStore((s) => s.replaceProgress)
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  // Clear the status line after a few seconds.
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 8000)
    return () => window.clearTimeout(timer)
  }, [message])

  const handleExport = () => {
    // getState() reads the store right now without subscribing, which is what we want
    // inside a click handler (no re-render needed).
    downloadProgressFile(selectProgress(useProgressStore.getState()))
    setMessage({ kind: 'ok', text: 'Progress exported' })
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so picking the same file twice still fires a change event.
    event.target.value = ''
    if (!file) return

    const result = parseProgressFile(await file.text())
    if (result.ok) {
      replaceProgress(result.progress)
      setMessage({ kind: 'ok', text: 'Progress imported. Your previous progress was replaced.' })
    } else {
      setMessage({ kind: 'error', text: `Import failed. ${result.error}` })
    }
  }

  return (
    <div className="flex flex-col">
      <button type="button" className={ITEM} onClick={handleExport}>
        <Download size={16} strokeWidth={1.5} aria-hidden />
        Export progress
      </button>
      <button type="button" className={ITEM} onClick={() => fileInput.current?.click()}>
        <Upload size={16} strokeWidth={1.5} aria-hidden />
        Import progress
      </button>
      <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} onChange={handleFile} />
      {/* The live region stays in the page at all times so screen readers announce changes to it. */}
      <p role="status" className={`px-2 text-caption ${message ? 'mt-1 pb-1' : ''} ${message?.kind === 'error' ? 'text-fail' : 'text-ink-2'}`}>
        {message?.text}
      </p>
    </div>
  )
}
