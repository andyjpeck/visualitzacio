import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '../store/app-store'
import { usePresetDropAndPaste } from './use-preset-drop-and-paste'
import { CURRENT_PRESET_SCHEMA_VERSION } from '../../contracts/preset-schema'
import { DEFAULT_AUDIO_BANDS } from '../../contracts/preset-settings'

function TestComponent(props: {
  onSuccess?: (name: string) => void
  onError?: (err: string) => void
}) {
  const { isDraggingPreset } = usePresetDropAndPaste(props)
  return (
    <div>
      <div data-testid="drop-state">{isDraggingPreset ? 'DRAGGING' : 'IDLE'}</div>
      <input data-testid="test-text-input" type="text" />
    </div>
  )
}

describe('usePresetDropAndPaste Hook (Task 4.3)', () => {
  const validPresetJson = JSON.stringify({
    schemaVersion: CURRENT_PRESET_SCHEMA_VERSION,
    metadata: { name: 'Pasted Drop Preset', version: 1 },
    settings: {
      targetFps: 60,
      resolutionScale: 1.0,
      audioBands: DEFAULT_AUDIO_BANDS,
    },
    nodes: [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        params: { opacity: 0.88 },
      },
    ],
  })

  beforeEach(() => {
    useAppStore.getState().clearHistory()
  })

  it('toggles isDraggingPreset on window dragover and dragleave', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('drop-state')).toHaveTextContent('IDLE')

    const dataTransfer = {
      types: ['Files'],
      dropEffect: 'none',
    }

    fireEvent.dragOver(window, { dataTransfer })
    expect(screen.getByTestId('drop-state')).toHaveTextContent('DRAGGING')

    fireEvent.dragLeave(window, { relatedTarget: document.documentElement })
    expect(screen.getByTestId('drop-state')).toHaveTextContent('IDLE')
  })

  it('imports preset and calls onSuccess when a .json file is dropped', async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    render(<TestComponent onSuccess={onSuccess} onError={onError} />)

    const file = new File([validPresetJson], 'my-preset.json', { type: 'application/json' })
    const dataTransfer = {
      files: [file],
      types: ['Files'],
    }

    fireEvent.drop(window, { dataTransfer })

    // Wait for FileReader async onload
    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('my-preset')
    })

    const master = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'master-frame-buffer')
    expect(master?.data.opacity).toBe(0.88)
    expect(onError).not.toHaveBeenCalled()
  })

  it('imports valid preset on window paste event', () => {
    const onSuccess = vi.fn()
    render(<TestComponent onSuccess={onSuccess} />)

    const clipboardData = {
      getData: (type: string) => (type === 'text' ? validPresetJson : ''),
    }

    fireEvent.paste(window, { clipboardData })

    expect(onSuccess).toHaveBeenCalledWith('Pasted Drop Preset')
    const master = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'master-frame-buffer')
    expect(master?.data.opacity).toBe(0.88)
  })

  it('ignores paste event when user is focused inside a text input', () => {
    const onSuccess = vi.fn()
    render(<TestComponent onSuccess={onSuccess} />)

    const input = screen.getByTestId('test-text-input')
    input.focus()

    const clipboardData = {
      getData: (type: string) => (type === 'text' ? validPresetJson : ''),
    }

    fireEvent.paste(input, { clipboardData })

    expect(onSuccess).not.toHaveBeenCalled()
  })
})
