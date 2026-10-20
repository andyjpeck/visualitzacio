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

    expect(screen.getByText('Blend Mode')).toBeInTheDocument()
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
    expect(screen.getByText('Audio Reactivity')).toBeInTheDocument()
    expect(screen.getByText('Scale')).toBeInTheDocument()

    // Adjust scale slider
    const scaleSlider = screen.getByLabelText('Scale')
    fireEvent.change(scaleSlider, { target: { value: '2.5' } })

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(updatedNode?.data.scale).toBe(2.5)
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
})
