import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '../store/app-store'
import { PresetJsonTab } from './preset-json-tab'

describe('PresetJsonTab Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output', opacity: 1.0 },
        },
      ],
      graphEdges: [],
      selectedNodeId: 'master-frame-buffer',
    })
  })

  it('renders the live JSON of the current preset in the textarea', () => {
    render(<PresetJsonTab />)

    expect(screen.getByTestId('preset-json-tab')).toBeInTheDocument()
    const textarea = screen.getByTestId('json-editor-textarea') as HTMLTextAreaElement
    expect(textarea.value).toContain('"schemaVersion": 2')
    expect(textarea.value).toContain('"root"')
    expect(textarea.value).toContain('master-frame-buffer')
    expect(screen.getByText('LIVE PRESET SYNCHRONIZED')).toBeInTheDocument()
  })

  it('copies preset JSON to clipboard on Copy button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<PresetJsonTab />)

    const copyBtn = screen.getByTestId('json-copy-btn')
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedStr = writeTextMock.mock.calls[0][0]
    expect(copiedStr).toContain('"schemaVersion": 2')
    expect(copiedStr).toContain('"root"')
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('downloads preset JSON file on Download button click', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURLMock = vi.fn()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    render(<PresetJsonTab />)

    const downloadBtn = screen.getByTestId('json-download-btn')
    fireEvent.click(downloadBtn)

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(anchorClickSpy).toHaveBeenCalledTimes(1)

    anchorClickSpy.mockRestore()
  })

  it('uploads a valid JSON file and updates the scene graph', async () => {
    render(<PresetJsonTab />)

    const fileInput = screen.getByTestId('json-file-input') as HTMLInputElement
    const validJson = JSON.stringify({
      schemaVersion: 1,
      metadata: { name: 'Uploaded Composition', version: 1 },
      settings: {
        targetFps: 60,
        resolutionScale: 1.0,
        audioBands: useAppStore.getState().audioBands,
      },
      nodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          params: { opacity: 0.55 },
        },
      ],
    })

    const file = new File([validJson], 'composition.json', { type: 'application/json' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await vi.waitFor(() => {
      const master = useAppStore
        .getState()
        .graphNodes.find((n) => n.id === 'master-frame-buffer')
      expect(master?.data.opacity).toBe(0.55)
    })
  })

  it('tracks modifications, allows reverting, and applies valid edits on Apply click', async () => {
    render(<PresetJsonTab />)

    const textarea = screen.getByTestId('json-editor-textarea') as HTMLTextAreaElement
    const initialText = textarea.value

    // Edit textarea
    act(() => {
      fireEvent.change(textarea, { target: { value: '{"brokenJson": true' } })
    })

    expect(screen.getByText('MODIFIED (UNSAVED)')).toBeInTheDocument()
    expect(screen.getByTestId('json-apply-btn')).toBeInTheDocument()
    expect(screen.getByTestId('json-revert-btn')).toBeInTheDocument()

    // Test revert
    act(() => {
      fireEvent.click(screen.getByTestId('json-revert-btn'))
    })
    expect(textarea.value).toBe(initialText)
    expect(screen.getByText('LIVE PRESET SYNCHRONIZED')).toBeInTheDocument()

    // Edit with valid modified preset
    const modifiedValidJson = JSON.stringify({
      schemaVersion: 1,
      metadata: { name: 'Directly Applied Preset', version: 1 },
      settings: {
        targetFps: 60,
        resolutionScale: 1.0,
        audioBands: useAppStore.getState().audioBands,
      },
      nodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          params: { opacity: 0.77 },
        },
      ],
    })

    act(() => {
      fireEvent.change(textarea, { target: { value: modifiedValidJson } })
      fireEvent.click(screen.getByTestId('json-apply-btn'))
    })

    expect(screen.queryByTestId('json-error-banner')).not.toBeInTheDocument()
    expect(screen.getByText('LIVE PRESET SYNCHRONIZED')).toBeInTheDocument()
    const master = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'master-frame-buffer')
    expect(master?.data.opacity).toBe(0.77)
  })

  it('displays error banner when applying invalid JSON', () => {
    render(<PresetJsonTab />)

    const textarea = screen.getByTestId('json-editor-textarea') as HTMLTextAreaElement
    act(() => {
      fireEvent.change(textarea, { target: { value: '{ not valid json ...' } })
      fireEvent.click(screen.getByTestId('json-apply-btn'))
    })

    expect(screen.getByTestId('json-error-banner')).toBeInTheDocument()
  })
})
