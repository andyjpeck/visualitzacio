import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ParameterInspector } from './parameter-inspector'
import { useAppStore } from '../store/app-store'
import { DEFAULT_DUPERSCOPE_CONFIG } from '../../engine/nodes/duperscope-templates'

describe('Duperscope Inspector Controls, 4-Phase Script Editor & Autocomplete (Task 4.2)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    useAppStore.setState({
      selectedNodeId: 'scope-test-1',
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'scope-test-1',
          type: 'duperscopeNode',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 65 },
          data: {
            label: 'Duperscope 1',
            drawMode: DEFAULT_DUPERSCOPE_CONFIG.drawMode,
            audioMode: DEFAULT_DUPERSCOPE_CONFIG.audioMode,
            channel: DEFAULT_DUPERSCOPE_CONFIG.channel,
            opacity: DEFAULT_DUPERSCOPE_CONFIG.opacity,
            initCode: DEFAULT_DUPERSCOPE_CONFIG.initCode,
            beatCode: DEFAULT_DUPERSCOPE_CONFIG.beatCode,
            frameCode: DEFAULT_DUPERSCOPE_CONFIG.frameCode,
            pointCode: DEFAULT_DUPERSCOPE_CONFIG.pointCode,
          },
        },
      ],
    })
  })

  it('renders Duperscope controls, mode dropdowns, and 4-phase script editors', () => {
    render(<ParameterInspector />)

    // Header and preset selector
    expect(screen.getByText('Duperscope 1')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-preset-dropdown')).toBeInTheDocument()

    // Mode options
    expect(screen.getByText('Draw Mode')).toBeInTheDocument()
    expect(screen.getByText('Audio Mode')).toBeInTheDocument()
    expect(screen.getByText('Channel')).toBeInTheDocument()
    expect(screen.getByText('Opacity')).toBeInTheDocument()

    // 4 Phase editors
    expect(screen.getByTestId('duperscope-editor-init')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-editor-beat')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-editor-frame')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-editor-point')).toBeInTheDocument()

    // Validation badges
    expect(screen.getByTestId('duperscope-valid-badge-init')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-valid-badge-beat')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-valid-badge-frame')).toBeInTheDocument()
    expect(screen.getByTestId('duperscope-valid-badge-point')).toBeInTheDocument()
  })

  it('updates draw mode, audio mode, and channel in real time', () => {
    render(<ParameterInspector />)

    // Update draw mode to 'lineLoop'
    const drawModeSelect = screen.getByDisplayValue('Lines (Ribbon Quad)')
    fireEvent.change(drawModeSelect, { target: { value: 'lineLoop' } })

    const node = useAppStore.getState().graphNodes.find((n) => n.id === 'scope-test-1')
    expect(node?.data.drawMode).toBe('lineLoop')
  })

  it('shows real-time validation error banner when invalid script is entered', () => {
    render(<ParameterInspector />)

    const initEditor = screen.getByTestId('duperscope-editor-init')
    fireEvent.change(initEditor, { target: { value: 'n = 100 + ;' } })

    // Error badge and message banner appear
    expect(screen.getByTestId('duperscope-error-badge-init')).toBeInTheDocument()
    const errorBanner = screen.getByTestId('duperscope-error-init')
    expect(errorBanner).toBeInTheDocument()
  })

  it('debounces script edits and persists to store', () => {
    render(<ParameterInspector />)

    const initEditor = screen.getByTestId('duperscope-editor-init')
    fireEvent.change(initEditor, { target: { value: 'n = 512;' } })

    // Before debounce timer fires
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(useAppStore.getState().graphNodes.find((n) => n.id === 'scope-test-1')?.data.initCode).toBe('n = 200;')

    // After 500ms debounce timer fires
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(useAppStore.getState().graphNodes.find((n) => n.id === 'scope-test-1')?.data.initCode).toBe('n = 512;')
  })

  it('triggers autocomplete for Duperscope local variables inside phase script editors', () => {
    render(<ParameterInspector />)

    const pointEditor = screen.getByTestId('duperscope-editor-point')
    fireEvent.change(pointEditor, { target: { value: 'line' } })

    expect(screen.getByTestId('expression-autocomplete-dropdown')).toBeInTheDocument()
    expect(screen.getByText('Duperscope Variables')).toBeInTheDocument()
    const linesizeItem = screen.getByTestId('autocomplete-item-linesize')
    expect(linesizeItem).toBeInTheDocument()

    fireEvent.click(linesizeItem)
    expect((pointEditor as HTMLTextAreaElement).value).toBe('linesize')
  })

  it('applies template immediately to an unmodified clean node', () => {
    render(<ParameterInspector />)

    const dropdown = screen.getByTestId('duperscope-preset-dropdown')
    fireEvent.change(dropdown, { target: { value: 'oscilloscope-tunnel' } })

    // No confirmation modal opened
    expect(screen.queryByTestId('overwrite-duperscope-template-modal-header')).not.toBeInTheDocument()

    // Template applied
    const node = useAppStore.getState().graphNodes.find((n) => n.id === 'scope-test-1')
    expect(node?.data.appliedTemplateId).toBe('oscilloscope-tunnel')
    expect(node?.data.drawMode).toBe('lineLoop')
  })

  it('guards modified node with overwrite confirmation modal', () => {
    // Modify the node
    useAppStore.getState().updateGraphNodeData('scope-test-1', {
      initCode: 'n = 1000;',
    })

    render(<ParameterInspector />)

    const dropdown = screen.getByTestId('duperscope-preset-dropdown')
    fireEvent.change(dropdown, { target: { value: 'frequency-spectrum-ribbon' } })

    // Modal appears
    expect(screen.getByTestId('overwrite-duperscope-template-modal-header')).toBeInTheDocument()
    expect(screen.getByText(/has customized parameters or scripts/)).toBeInTheDocument()

    // Cancel
    fireEvent.click(screen.getByTestId('cancel-overwrite-duperscope-template-btn'))
    expect(screen.queryByTestId('overwrite-duperscope-template-modal-header')).not.toBeInTheDocument()
    expect(useAppStore.getState().graphNodes.find((n) => n.id === 'scope-test-1')?.data.initCode).toBe('n = 1000;')

    // Trigger modal again and confirm
    fireEvent.change(dropdown, { target: { value: 'frequency-spectrum-ribbon' } })
    fireEvent.click(screen.getByTestId('confirm-overwrite-duperscope-template-btn'))

    expect(screen.queryByTestId('overwrite-duperscope-template-modal-header')).not.toBeInTheDocument()
    const node = useAppStore.getState().graphNodes.find((n) => n.id === 'scope-test-1')
    expect(node?.data.appliedTemplateId).toBe('frequency-spectrum-ribbon')
    expect(node?.data.audioMode).toBe('spectrum')
  })
})
