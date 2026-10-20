import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { VisualNodeGraph } from './visual-node-graph'
import {
  DEFAULT_GRAPH_EDGES,
  DEFAULT_GRAPH_NODES,
  useAppStore,
} from '../store/app-store'

describe('VisualNodeGraph Component & Store Synchronization', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedNodeId: 'master-frame-buffer',
      graphNodes: [...DEFAULT_GRAPH_NODES],
      graphEdges: [...DEFAULT_GRAPH_EDGES],
    })
  })

  it('renders graph canvas, action buttons, and initial default nodes', () => {
    render(<VisualNodeGraph />)

    expect(screen.getByTestId('visual-node-graph')).toBeInTheDocument()
    expect(screen.getByTestId('graph-add-node-button')).toBeInTheDocument()
    expect(screen.getByTestId('graph-auto-layout-button')).toBeInTheDocument()

    // Default nodes rendered
    expect(screen.getByText('Master Output')).toBeInTheDocument()
    expect(screen.getByText('Crystal Synth')).toBeInTheDocument()
  })

  it('opens Add Node menu and adds a new Frame Buffer node', () => {
    render(<VisualNodeGraph />)

    const addBtn = screen.getByTestId('graph-add-node-button')
    fireEvent.click(addBtn)

    expect(screen.getByTestId('graph-add-node-menu')).toBeInTheDocument()

    const addFbBtn = screen.getByTestId('add-node-frame-buffer')
    fireEvent.click(addFbBtn)

    const state = useAppStore.getState()
    expect(state.graphNodes).toHaveLength(3)

    const addedNode = state.graphNodes.find((n) => n.type === 'frameBuffer')
    expect(addedNode).toBeDefined()
    expect(state.selectedNodeId).toBe(addedNode?.id)
  })

  it('runs auto-layout when clicking Auto-Layout button', () => {
    render(<VisualNodeGraph />)

    const layoutBtn = screen.getByTestId('graph-auto-layout-button')
    fireEvent.click(layoutBtn)

    const state = useAppStore.getState()
    const master = state.graphNodes.find((n) => n.id === 'master-frame-buffer')!
    const synth = state.graphNodes.find((n) => n.id === 'test-visual-1')!

    // Crystal synth is structurally nested as a child of master frame buffer
    expect(synth.parentId).toBe('master-frame-buffer')
    expect(master).toBeDefined()
    expect(synth.position.y).toBeGreaterThanOrEqual(120)
  })

  it('deletes a selected non-master node and cleans up its edges', () => {
    // Select the crystal synth node
    useAppStore.setState({ selectedNodeId: 'test-visual-1' })
    render(<VisualNodeGraph />)

    const deleteBtn = screen.getByTestId('graph-delete-node-button')
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)

    const state = useAppStore.getState()
    expect(state.graphNodes.find((n) => n.id === 'test-visual-1')).toBeUndefined()
    expect(state.graphEdges.find((e) => e.source === 'test-visual-1')).toBeUndefined()
  })

  it('prevents deleting the master root frame buffer', () => {
    useAppStore.setState({ selectedNodeId: 'master-frame-buffer' })
    render(<VisualNodeGraph />)

    // Delete button must NOT be shown for master frame buffer
    expect(screen.queryByTestId('graph-delete-node-button')).not.toBeInTheDocument()

    // Even if removeGraphNode is called programmatically, it returns false
    const success = useAppStore.getState().removeGraphNode('master-frame-buffer')
    expect(success).toBe(false)
    expect(useAppStore.getState().graphNodes.find((n) => n.id === 'master-frame-buffer')).toBeDefined()
  })
})
