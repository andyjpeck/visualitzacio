import { useEffect, useState } from 'react'
import { useAppStore } from '../store/app-store'
import { deserializePreset } from '../../engine/presets/preset-deserializer'

export interface UsePresetDropAndPasteOptions {
  onSuccess?: (presetName: string) => void
  onError?: (errorMessage: string) => void
}

/**
 * Global hook enabling preset import via file drag-and-drop onto the window/viewport
 * and clipboard paste (Ctrl+V / Cmd+V).
 *
 * Focus-aware: ignores clipboard paste events when the user is actively focused on
 * text inputs or textareas.
 */
export function usePresetDropAndPaste(options: UsePresetDropAndPasteOptions = {}): {
  isDraggingPreset: boolean
} {
  const [isDraggingPreset, setIsDraggingPreset] = useState(false)
  const loadPreset = useAppStore((state) => state.loadPreset)

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      // Check if drag event contains files
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setIsDraggingPreset(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      // Only set to false if leaving the window
      if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
        setIsDraggingPreset(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      setIsDraggingPreset(false)
      if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
        return
      }

      const file = e.dataTransfer.files[0]
      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
        return
      }

      e.preventDefault()
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result
        if (typeof text === 'string') {
          const result = loadPreset(text)
          if (result.success) {
            options.onSuccess?.(file.name.replace(/\.json$/i, ''))
          } else {
            options.onError?.(result.errors?.join('; ') ?? 'Failed to import preset.')
          }
        }
      }
      reader.onerror = () => {
        options.onError?.('Failed to read preset file.')
      }
      reader.readAsText(file)
    }

    const handlePaste = (e: ClipboardEvent) => {
      // Guard: do not intercept paste when focusing an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const text = e.clipboardData?.getData('text')
      if (!text || !text.trim().startsWith('{')) {
        return
      }

      // Check if text is a valid preset before consuming the event
      const preview = deserializePreset(text)
      if (preview.success) {
        e.preventDefault()
        const result = loadPreset(text)
        if (result.success) {
          options.onSuccess?.(preview.metadata?.name ?? 'Pasted Preset')
        } else {
          options.onError?.(result.errors?.join('; ') ?? 'Failed to import pasted preset.')
        }
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    window.addEventListener('paste', handlePaste)

    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('paste', handlePaste)
    }
  }, [loadPreset, options])

  return { isDraggingPreset }
}
