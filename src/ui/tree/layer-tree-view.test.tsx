import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LayerTreeView } from './layer-tree-view'
import { WorkspacePane } from '../studio/workspace-pane'
import { useAppStore } from '../store/app-store'

describe('LayerTreeView Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'source-buffer',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 65 },
          data: { label: 'Source Buffer', saveTo: '@TEX' },
        },
        {
          id: 'synth-child',
          type: 'testVisual',
          parentId: 'source-buffer',
          position: { x: 20, y: 65 },
          data: { label: 'Crystal Synth' },
        },
        {
          id: 'consumer-buffer',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 240 },
          data: { label: 'Consumer Buffer', loadFrom: '@TEX' },
        },
      ],
      selectedNodeId: 'master-frame-buffer',
      bottomViewMode: 'tree',
      hoveredBufferTag: null,
    })
  })

  it('renders all tree nodes with execution order badges', () => {
    render(<LayerTreeView />)

    expect(screen.getByTestId('layer-tree-item-master-frame-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-source-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-consumer-buffer')).toBeInTheDocument()

    // Execution badge check
    expect(screen.getByTestId('tree-exec-badge-synth-child')).toHaveTextContent('#1')
    expect(screen.getByTestId('tree-exec-badge-source-buffer')).toHaveTextContent('#2')
    expect(screen.getByTestId('tree-exec-badge-consumer-buffer')).toHaveTextContent('#3')
    expect(screen.getByTestId('tree-exec-badge-master-frame-buffer')).toHaveTextContent('#4')
  })

  it('updates selectedNodeId when clicking an item row', () => {
    render(<LayerTreeView />)

    const consumerRow = screen.getByTestId('layer-tree-item-consumer-buffer')
    fireEvent.click(consumerRow)

    expect(useAppStore.getState().selectedNodeId).toBe('consumer-buffer')
  })

  it('triggers interactive semantic tag highlighting on tag hover', () => {
    render(<LayerTreeView />)

    const pubTag = screen.getByTestId('tree-tag-save-source-buffer')
    expect(pubTag).toHaveTextContent('PUB @TEX')

    const loadTag = screen.getByTestId('tree-tag-load-consumer-buffer')
    expect(loadTag).toHaveTextContent('IN @TEX')

    // Hover over PUB @TEX
    fireEvent.mouseEnter(pubTag)
    expect(useAppStore.getState().hoveredBufferTag).toBe('@TEX')

    // Leave
    fireEvent.mouseLeave(pubTag)
    expect(useAppStore.getState().hoveredBufferTag).toBeNull()
  })

  it('collapses and expands container children on chevron click', () => {
    render(<LayerTreeView />)

    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()

    // Click collapse on source-buffer
    const collapseBtn = screen.getByTestId('tree-collapse-btn-source-buffer')
    fireEvent.click(collapseBtn)

    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()

    // Click again to expand
    fireEvent.click(collapseBtn)
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
  })

  it('swaps execution order when clicking Move Up / Move Down', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'layer-1',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 65 },
          data: { label: 'Layer 1' },
        },
        {
          id: 'layer-2',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 180 },
          data: { label: 'Layer 2' },
        },
      ],
    })

    render(<LayerTreeView />)

    const moveDownBtn = screen.getByTestId('tree-move-down-layer-1')
    expect(moveDownBtn).not.toBeDisabled()

    // Move layer-1 down past layer-2
    fireEvent.click(moveDownBtn)

    const nodes = useAppStore.getState().graphNodes
    const layer1 = nodes.find((n) => n.id === 'layer-1')!
    const layer2 = nodes.find((n) => n.id === 'layer-2')!

    // Layer 1 Y position should now be greater than layer 2 position
    expect(layer1.position.y).toBeGreaterThan(layer2.position.y)
  })
})

describe('WorkspacePane Component', () => {
  it('renders dedicated Layer Tree with active count badge and expand/collapse actions', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'source-buffer',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 65 },
          data: { label: 'Source Buffer' },
        },
        {
          id: 'synth-child',
          type: 'testVisual',
          parentId: 'source-buffer',
          position: { x: 20, y: 65 },
          data: { label: 'Crystal Synth' },
        },
      ],
      selectedNodeId: 'master-frame-buffer',
    })

    render(<WorkspacePane />)

    expect(screen.getByTestId('workspace-pane')).toBeInTheDocument()
    expect(screen.getByTestId('layers-count-badge')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-view')).toBeInTheDocument()

    // Test Toggle Collapse All / Expand All button
    const toggleBtn = screen.getByTestId('toggle-collapse-all-btn')
    expect(toggleBtn).toHaveTextContent('Collapse All')

    // Click toggle to Collapse All
    fireEvent.click(toggleBtn)
    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()
    expect(toggleBtn).toHaveTextContent('Expand All')

    // Click toggle again to Expand All
    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
    expect(toggleBtn).toHaveTextContent('Collapse All')

    // Test Collapse All
    const collapseAllBtn = screen.getByTestId('collapse-all-layers-btn')
    fireEvent.click(collapseAllBtn)

    // Synth child should be hidden
    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()

    // Test Expand All
    const expandAllBtn = screen.getByTestId('expand-all-layers-btn')
    fireEvent.click(expandAllBtn)

    // Synth child should be visible again
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
  })
})
