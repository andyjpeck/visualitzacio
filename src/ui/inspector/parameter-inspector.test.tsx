import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ParameterInspector } from './parameter-inspector'
import {
  DEFAULT_GRAPH_NODES,
  useAppStore,
} from '../store/app-store'

describe('ParameterInspector Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedNodeId: 'master-frame-buffer',
      graphNodes: [...DEFAULT_GRAPH_NODES],
      targetFps: 60,
      resolutionScale: 1.0,
    })
  })

  it('renders Master Output parameters when master-frame-buffer is selected', () => {
    render(<ParameterInspector />)

    expect(screen.getByTestId('parameter-inspector')).toBeInTheDocument()
    expect(screen.getByText('Master Output')).toBeInTheDocument()
    expect(screen.getByText(/masterFrameBuffer/i)).toBeInTheDocument()

    expect(screen.getByText('Input Blend Mode')).toBeInTheDocument()
    expect(screen.getByText('Output Blend Mode')).toBeInTheDocument()
    expect(screen.getByText('Opacity')).toBeInTheDocument()
  })

  it('renders global preset settings when no node is selected', () => {
    useAppStore.setState({ selectedNodeId: null })
    render(<ParameterInspector />)

    expect(screen.getByTestId('parameter-inspector-global')).toBeInTheDocument()
    expect(screen.getByText('Preset-Wide Settings')).toBeInTheDocument()
    expect(screen.getByText('Target FPS')).toBeInTheDocument()
    expect(screen.getByText('Resolution Scale')).toBeInTheDocument()
  })

  it('renders Crystal Synth parameters when test-visual-1 is selected and updates on change', () => {
    useAppStore.setState({ selectedNodeId: 'test-visual-1' })
    render(<ParameterInspector />)

    expect(screen.getByText('Crystal Synth')).toBeInTheDocument()
    expect(screen.getByText(/testVisual/i)).toBeInTheDocument()

    expect(screen.getByText('Shape')).toBeInTheDocument()
    expect(screen.getByText('Scale')).toBeInTheDocument()

    // Adjust scale slider
    const scaleSlider = screen.getByLabelText('Scale')
    fireEvent.change(scaleSlider, { target: { value: '2.5' } })

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(updatedNode?.data.scale).toBe(2.5)
  })

  it('allows customizing the display name of a selected node', () => {
    useAppStore.setState({ selectedNodeId: 'test-visual-1' })
    render(<ParameterInspector />)

    const displayNameInput = screen.getByLabelText('Display Name')
    expect(displayNameInput).toHaveValue('Crystal Synth')

    fireEvent.change(displayNameInput, { target: { value: 'Cosmic Core' } })

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(updatedNode?.data.label).toBe('Cosmic Core')
  })

  it('allows changing parent container of a node via dropdown', () => {
    // Add another frame buffer to reparent to
    useAppStore.getState().addGraphNode({
      id: 'fb-target',
      type: 'frameBuffer',
      parentId: 'master-frame-buffer',
      position: { x: 20, y: 130 },
      data: { label: 'Target Buffer' },
    })

    useAppStore.setState({ selectedNodeId: 'test-visual-1' })
    render(<ParameterInspector />)

    const parentSelect = screen.getByLabelText('Parent Container')
    expect(parentSelect).toHaveValue('master-frame-buffer')

    // Change to 'fb-target'
    fireEvent.change(parentSelect, { target: { value: 'fb-target' } })

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(updatedNode?.parentId).toBe('fb-target')
    expect(updatedNode?.extent).toBe('parent')

    // Change back to 'master-frame-buffer'
    fireEvent.change(parentSelect, { target: { value: 'master-frame-buffer' } })

    const reparentedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(reparentedNode?.parentId).toBe('master-frame-buffer')
    expect(reparentedNode?.extent).toBe('parent')
  })

  it('applies built-in template to Frame Buffer node', () => {
    // Add a frame buffer node and select it
    useAppStore.getState().addGraphNode({
      id: 'fb-test',
      type: 'frameBuffer',
      position: { x: 0, y: 0 },
      data: {
        label: 'Feedback Pass',
        blendMode: 'replace',
        feedback: false,
      },
    })
    useAppStore.setState({ selectedNodeId: 'fb-test' })

    render(<ParameterInspector />)

    expect(screen.getByText('Feedback Pass')).toBeInTheDocument()
    const dropdown = screen.getByTestId('component-preset-dropdown')
    expect(dropdown).toBeInTheDocument()

    // Select 'phosphor-trails' template
    fireEvent.change(dropdown, { target: { value: 'phosphor-trails' } })

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-test')
    expect(updatedNode?.data.feedback).toBe(true)
    expect(updatedNode?.data.blendMode).toBe('additive')
  })

  it('updates saveTo and loadFrom named buffer tags with @ prefix formatting', () => {
    useAppStore.getState().addGraphNode({
      id: 'fb-buffer-test',
      type: 'frameBuffer',
      position: { x: 0, y: 0 },
      data: {
        label: 'Routing Buffer',
      },
    })
    useAppStore.setState({ selectedNodeId: 'fb-buffer-test' })

    render(<ParameterInspector />)

    const saveToInput = screen.getByLabelText('Publish Output (@NAME)')
    const loadFromInput = screen.getByLabelText('Sample Input (@NAME)')

    expect(saveToInput).toBeInTheDocument()
    expect(loadFromInput).toBeInTheDocument()

    // Type without @ prefix -> auto-formats to @BUFFER_A
    fireEvent.change(saveToInput, { target: { value: 'BUFFER_A' } })
    let updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-buffer-test')
    expect(updatedNode?.data.saveTo).toBe('@BUFFER_A')

    // Type with @ prefix -> preserves @INPUT_B
    fireEvent.change(loadFromInput, { target: { value: '@INPUT_B' } })
    updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-buffer-test')
    expect(updatedNode?.data.loadFrom).toBe('@INPUT_B')

    // Clear value -> clears to empty string
    fireEvent.change(saveToInput, { target: { value: '' } })
    updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-buffer-test')
    expect(updatedNode?.data.saveTo).toBe('')
  })

  it('updates input and output blend modes including none option', () => {
    useAppStore.getState().addGraphNode({
      id: 'fb-blend-test',
      type: 'frameBuffer',
      position: { x: 0, y: 0 },
      data: {
        label: 'Blend Mode Buffer',
      },
    })
    useAppStore.setState({ selectedNodeId: 'fb-blend-test' })

    render(<ParameterInspector />)

    const inputBlendSelect = screen.getByLabelText('Input Blend Mode')
    const outputBlendSelect = screen.getByLabelText('Output Blend Mode')

    expect(inputBlendSelect).toBeInTheDocument()
    expect(outputBlendSelect).toBeInTheDocument()

    // Change output blend mode to 'none' (pure offscreen)
    fireEvent.change(outputBlendSelect, { target: { value: 'none' } })
    let updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-blend-test')
    expect(updatedNode?.data.outputBlendMode).toBe('none')

    // Change input blend mode to 'replace'
    fireEvent.change(inputBlendSelect, { target: { value: 'replace' } })
    updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-blend-test')
    expect(updatedNode?.data.inputBlendMode).toBe('replace')
  })
})
