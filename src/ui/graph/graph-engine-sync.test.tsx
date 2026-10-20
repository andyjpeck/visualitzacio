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
    expect(screen.queryByTestId('graph-add-node-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('graph-auto-layout-button')).toBeInTheDocument()

    // Default nodes rendered
    expect(screen.getByText('Master Output')).toBeInTheDocument()
    expect(screen.getByText('Crystal Synth')).toBeInTheDocument()
  })

  it('adds a nested Frame Buffer child node via the Root Frame Buffer + button', () => {
    render(<VisualNodeGraph />)

    const addBtn = screen.getByTestId('master-add-child-button')
    fireEvent.click(addBtn)

    expect(screen.getByTestId('master-add-child-menu')).toBeInTheDocument()

    const addFbBtn = screen.getByTestId('master-add-child-frame-buffer')
    fireEvent.click(addFbBtn)

    const state = useAppStore.getState()
    expect(state.graphNodes).toHaveLength(3)

    const addedNode = state.graphNodes.find((n) => n.type === 'frameBuffer')
    expect(addedNode).toBeDefined()
    expect(addedNode?.parentId).toBe('master-frame-buffer')
    expect(state.selectedNodeId).toBe(addedNode?.id)
  })

  it('adds a child synth inside Root Frame Buffer via the + button', () => {
    render(<VisualNodeGraph />)

    const addBtn = screen.getByTestId('master-add-child-button')
    fireEvent.click(addBtn)

    const addChildSynthBtn = screen.getByTestId('master-add-child-synth')
    fireEvent.click(addChildSynthBtn)

    const state = useAppStore.getState()
    const childrenOfMaster = state.graphNodes.filter(
      (n) => n.parentId === 'master-frame-buffer',
    )
    expect(childrenOfMaster.length).toBeGreaterThanOrEqual(2)
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
    expect(synth.position.y).toBeGreaterThanOrEqual(50)
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

  it('ensures child node position does not cover the parent container header', () => {
    render(<VisualNodeGraph />)

    const child = useAppStore.getState().graphNodes.find((n) => n.id === 'test-visual-1')!
    expect(child.position.y).toBeGreaterThanOrEqual(60)
    expect(child.position.x).toBeGreaterThanOrEqual(15)
  })
})
