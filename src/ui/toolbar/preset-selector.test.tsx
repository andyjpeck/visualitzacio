import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Node } from '@xyflow/react'
import { PresetSelector } from './preset-selector'
import { useAppStore } from '../store/app-store'
import type { PresetCatalogItem } from './preset-catalog'
import type { Preset } from '../../contracts/preset-schema'

const mockSamplePreset: Preset = {
  schemaVersion: 2,
  metadata: {
    name: 'Sample Test Preset',
    description: 'A mock preset for testing selector behavior',
    author: 'Test Author',
    version: 1,
    created: '2026-10-30T00:00:00.000Z',
  },
  settings: {
    targetFps: 60,
    resolutionScale: 1.0,
    audioBands: {
      bassMin: 20,
      bassMax: 250,
      midMin: 250,
      midMax: 4000,
      trebleMin: 4000,
      trebleMax: 16000,
    },
  },
  feedback: {
    selectedTemplateId: 'clean-slate',
    feedbackEnabled: false,
    feedbackBlendMode: 'replace',
    feedbackOpacity: 1.0,
    feedbackScale: 1.0,
    feedbackRotation: 0,
    feedbackPositionX: 0,
    feedbackPositionY: 0,
    isCustomFeedbackConfig: false,
  },
  root: {
    id: 'master-frame-buffer',
    type: 'masterFrameBuffer',
    label: 'Master Output',
    params: {},
    children: [
      {
        id: 'child-from-preset',
        type: 'duperscopeNode',
        label: 'Preset Child',
        params: {},
      },
    ],
  },
}

const mockPresets: PresetCatalogItem[] = [
  {
    id: 'mock-sample-preset',
    name: 'Sample Test Preset',
    description: 'A mock preset for testing selector behavior',
    author: 'Test Author',
    version: 1,
    schemaVersion: 2,
    preset: mockSamplePreset,
  },
]

describe('PresetSelector Component', () => {
  beforeEach(() => {
    // Reset app store state
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
      ],
      graphEdges: [],
    })
  })

  it('renders select element with available presets', () => {
    render(<PresetSelector presets={mockPresets} />)
    const select = screen.getByTestId('toolbar-preset-selector')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Sample Test Preset')).toBeInTheDocument()
  })

  it('loads preset immediately without confirmation when canvas has no child layers', () => {
    render(<PresetSelector presets={mockPresets} />)

    const select = screen.getByTestId('toolbar-preset-selector')
    fireEvent.change(select, { target: { value: 'mock-sample-preset' } })

    // Modal should not open
    expect(screen.queryByTestId('confirm-overwrite-preset-btn')).not.toBeInTheDocument()

    // Store should have updated
    const state = useAppStore.getState()
    expect(state.graphNodes.some((n) => n.id === 'child-from-preset')).toBe(true)
  })

  it('opens confirmation modal when canvas has 1 or more child layers', () => {
    const existingNodes: Node[] = [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        position: { x: 0, y: 0 },
        data: { label: 'Master Output' },
      },
      {
        id: 'user-active-layer',
        type: 'duperscopeNode',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 20 },
        data: { label: 'Active Layer' },
      },
    ]
    useAppStore.setState({ graphNodes: existingNodes })

    render(<PresetSelector presets={mockPresets} />)

    const select = screen.getByTestId('toolbar-preset-selector')
    fireEvent.change(select, { target: { value: 'mock-sample-preset' } })

    // Confirmation modal should be visible
    expect(screen.getByTestId('confirm-overwrite-preset-btn')).toBeInTheDocument()
    expect(screen.getByText('Overwrite Active Scene?')).toBeInTheDocument()
    expect(screen.getByText('A mock preset for testing selector behavior')).toBeInTheDocument()

    // The canvas should NOT have changed yet
    const stateBefore = useAppStore.getState()
    expect(stateBefore.graphNodes.some((n) => n.id === 'user-active-layer')).toBe(true)
    expect(stateBefore.graphNodes.some((n) => n.id === 'child-from-preset')).toBe(false)
  })

  it('cancels preset load when clicking Keep Current in modal', () => {
    const existingNodes: Node[] = [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        position: { x: 0, y: 0 },
        data: { label: 'Master Output' },
      },
      {
        id: 'user-active-layer',
        type: 'duperscopeNode',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 20 },
        data: { label: 'Active Layer' },
      },
    ]
    useAppStore.setState({ graphNodes: existingNodes })

    render(<PresetSelector presets={mockPresets} />)

    const select = screen.getByTestId('toolbar-preset-selector')
    fireEvent.change(select, { target: { value: 'mock-sample-preset' } })

    const cancelBtn = screen.getByTestId('cancel-overwrite-preset-btn')
    fireEvent.click(cancelBtn)

    // Modal dismissed
    expect(screen.queryByTestId('confirm-overwrite-preset-btn')).not.toBeInTheDocument()

    // Canvas untouched
    const state = useAppStore.getState()
    expect(state.graphNodes.some((n) => n.id === 'user-active-layer')).toBe(true)
    expect(state.graphNodes.some((n) => n.id === 'child-from-preset')).toBe(false)
  })

  it('confirms preset overwrite and applies new preset when clicking Overwrite & Apply', () => {
    const existingNodes: Node[] = [
      {
        id: 'master-frame-buffer',
        type: 'masterFrameBuffer',
        position: { x: 0, y: 0 },
        data: { label: 'Master Output' },
      },
      {
        id: 'user-active-layer',
        type: 'duperscopeNode',
        parentId: 'master-frame-buffer',
        position: { x: 20, y: 20 },
        data: { label: 'Active Layer' },
      },
    ]
    useAppStore.setState({ graphNodes: existingNodes })

    render(<PresetSelector presets={mockPresets} />)

    const select = screen.getByTestId('toolbar-preset-selector')
    fireEvent.change(select, { target: { value: 'mock-sample-preset' } })

    const confirmBtn = screen.getByTestId('confirm-overwrite-preset-btn')
    fireEvent.click(confirmBtn)

    // Modal dismissed
    expect(screen.queryByTestId('confirm-overwrite-preset-btn')).not.toBeInTheDocument()

    // Canvas updated
    const state = useAppStore.getState()
    expect(state.graphNodes.some((n) => n.id === 'child-from-preset')).toBe(true)
    expect(state.graphNodes.some((n) => n.id === 'user-active-layer')).toBe(false)
    expect(state.canUndo).toBe(true)
  })
})
