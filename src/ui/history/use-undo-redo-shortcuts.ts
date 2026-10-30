import { useEffect } from 'react'
import { useAppStore } from '../store/app-store'

/**
 * Global keyboard shortcuts listener for Studio Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z).
 *
 * Bypasses hotkeys when text inputs or textareas are actively focused to preserve
 * native browser text editing, while permitting undo/redo from range sliders and general workspace canvas.
 */
export function useUndoRedoShortcuts(): void {
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTextInput =
        target &&
        ((target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (isTextInput) return

      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (!modifier) return

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      const isRedoKey =
        (e.key === 'y' && !e.shiftKey) ||
        (e.key === 'Y' && !e.shiftKey) ||
        (e.key === 'z' && e.shiftKey) ||
        (e.key === 'Z' && e.shiftKey)

      if (isRedoKey) {
        e.preventDefault()
        redo()
        return
      }

      // Undo: Ctrl+Z (without Shift)
      const isUndoKey = (e.key === 'z' || e.key === 'Z') && !e.shiftKey
      if (isUndoKey) {
        e.preventDefault()
        undo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [undo, redo])
}
