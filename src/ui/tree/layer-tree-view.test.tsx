import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
      hoveredBufferTag: null,
    })
  })

  it('renders all tree nodes without redundant number badges', () => {
    render(<LayerTreeView />)

    expect(screen.getByTestId('layer-tree-item-master-frame-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-source-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-consumer-buffer')).toBeInTheDocument()

    // Verify execution number badges are removed for clean vertical list styling
    expect(screen.queryByTestId('tree-exec-badge-synth-child')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tree-exec-badge-source-buffer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tree-exec-badge-consumer-buffer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tree-exec-badge-master-frame-buffer')).not.toBeInTheDocument()
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

  it('renders drag handles for non-master nodes but not for master', () => {
    render(<LayerTreeView />)
    expect(screen.queryByTestId('tree-drag-handle-master-frame-buffer')).not.toBeInTheDocument()
    expect(screen.getByTestId('tree-drag-handle-source-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('tree-drag-handle-synth-child')).toBeInTheDocument()
  })

  it('enables inline renaming on label double-click and commits on Enter', () => {
    render(<LayerTreeView />)

    const labelSpan = screen.getByTestId('tree-label-synth-child')
    expect(labelSpan).toHaveTextContent('Crystal Synth')

    // Double-click to start inline rename
    fireEvent.doubleClick(labelSpan)

    const input = screen.getByTestId('tree-rename-input-synth-child') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('Crystal Synth')

    // Change input value and press Enter
    fireEvent.change(input, { target: { value: 'Quantum Synth' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    // Input should be unmounted and updated label displayed
    expect(screen.queryByTestId('tree-rename-input-synth-child')).not.toBeInTheDocument()
    expect(screen.getByTestId('tree-label-synth-child')).toHaveTextContent('Quantum Synth')

    // Store should be updated
    const node = useAppStore.getState().graphNodes.find((n) => n.id === 'synth-child')!
    expect(node.data?.label).toBe('Quantum Synth')
  })

  it('cancels inline renaming without changes on Escape', () => {
    render(<LayerTreeView />)

    const labelSpan = screen.getByTestId('tree-label-synth-child')
    fireEvent.doubleClick(labelSpan)

    const input = screen.getByTestId('tree-rename-input-synth-child') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Discarded Name' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByTestId('tree-rename-input-synth-child')).not.toBeInTheDocument()
    expect(screen.getByTestId('tree-label-synth-child')).toHaveTextContent('Crystal Synth')

    const node = useAppStore.getState().graphNodes.find((n) => n.id === 'synth-child')!
    expect(node.data?.label).toBe('Crystal Synth')
  })

  it('commits inline renaming on blur', () => {
    render(<LayerTreeView />)

    const labelSpan = screen.getByTestId('tree-label-synth-child')
    fireEvent.doubleClick(labelSpan)

    const input = screen.getByTestId('tree-rename-input-synth-child') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Blurred Name' } })
    fireEvent.blur(input)

    expect(screen.queryByTestId('tree-rename-input-synth-child')).not.toBeInTheDocument()
    expect(screen.getByTestId('tree-label-synth-child')).toHaveTextContent('Blurred Name')

    const node = useAppStore.getState().graphNodes.find((n) => n.id === 'synth-child')!
    expect(node.data?.label).toBe('Blurred Name')
  })

  it('reorders siblings when dragging and dropping below another node', () => {
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

    const layer1Row = screen.getByTestId('layer-tree-item-layer-1')
    const layer2Row = screen.getByTestId('layer-tree-item-layer-2')

    const dataTransfer = {
      setData: vi.fn(),
      getData: () => 'layer-1',
      dropEffect: 'none',
      effectAllowed: 'all',
    }

    fireEvent.dragStart(layer1Row, { dataTransfer })

    vi.spyOn(layer2Row, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 140,
      height: 40,
      left: 0,
      right: 200,
      width: 200,
      x: 0,
      y: 100,
      toJSON: () => {},
    })

    // Drag over bottom 25% (clientY = 135 -> offsetY = 35 > 40 * 0.75) -> 'after'
    const dragOverEv = createEvent.dragOver(layer2Row)
    Object.defineProperty(dragOverEv, 'clientY', { value: 135 })
    Object.defineProperty(dragOverEv, 'dataTransfer', { value: dataTransfer })
    fireEvent(layer2Row, dragOverEv)
    expect(layer2Row).toHaveAttribute('data-drop-position', 'after')

    // Drop
    fireEvent.drop(layer2Row, { dataTransfer })

    const nodes = useAppStore.getState().graphNodes
    const updatedLayer1 = nodes.find((n) => n.id === 'layer-1')!
    const updatedLayer2 = nodes.find((n) => n.id === 'layer-2')!

    // layer-1 should now be below layer-2 in Y position
    expect(updatedLayer1.position.y).toBeGreaterThan(updatedLayer2.position.y)
  })

  it('moves a layer into another container when dropped inside', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'container-buffer',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 65 },
          data: { label: 'Container Buffer' },
        },
        {
          id: 'orphan-synth',
          type: 'testVisual',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 200 },
          data: { label: 'Orphan Synth' },
        },
      ],
    })

    render(<LayerTreeView />)

    const synthRow = screen.getByTestId('layer-tree-item-orphan-synth')
    const containerRow = screen.getByTestId('layer-tree-item-container-buffer')

    const dataTransfer = {
      setData: vi.fn(),
      getData: () => 'orphan-synth',
      dropEffect: 'none',
      effectAllowed: 'all',
    }

    fireEvent.dragStart(synthRow, { dataTransfer })

    vi.spyOn(containerRow, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 140,
      height: 40,
      left: 0,
      right: 200,
      width: 200,
      x: 0,
      y: 100,
      toJSON: () => {},
    })

    // Drag over middle region (clientY = 120 -> offsetY = 20, between 10 and 30) -> 'inside'
    const dragOverEv = createEvent.dragOver(containerRow)
    Object.defineProperty(dragOverEv, 'clientY', { value: 120 })
    Object.defineProperty(dragOverEv, 'dataTransfer', { value: dataTransfer })
    fireEvent(containerRow, dragOverEv)
    expect(containerRow).toHaveAttribute('data-drop-position', 'inside')

    // Drop
    fireEvent.drop(containerRow, { dataTransfer })

    const nodes = useAppStore.getState().graphNodes
    const movedSynth = nodes.find((n) => n.id === 'orphan-synth')!

    // orphan-synth's parentId should now be container-buffer!
    expect(movedSynth.parentId).toBe('container-buffer')
  })

  it('prevents dropping a container into its own descendant', () => {
    render(<LayerTreeView />)

    const sourceRow = screen.getByTestId('layer-tree-item-source-buffer')
    const synthChildRow = screen.getByTestId('layer-tree-item-synth-child')

    const dataTransfer = {
      setData: vi.fn(),
      getData: () => 'source-buffer',
      dropEffect: 'none',
      effectAllowed: 'all',
    }

    fireEvent.dragStart(sourceRow, { dataTransfer })

    const dragOverEv = createEvent.dragOver(synthChildRow)
    Object.defineProperty(dragOverEv, 'clientY', { value: 120 })
    Object.defineProperty(dragOverEv, 'dataTransfer', { value: dataTransfer })
    fireEvent(synthChildRow, dragOverEv)

    // Should not set drop position because synth-child is descendant of source-buffer
    expect(synthChildRow).not.toHaveAttribute('data-drop-position')

    // Drop attempt
    fireEvent.drop(synthChildRow, { dataTransfer })

    // source-buffer parentId should remain master-frame-buffer
    const sourceNode = useAppStore.getState().graphNodes.find((n) => n.id === 'source-buffer')!
    expect(sourceNode.parentId).toBe('master-frame-buffer')
  })
})

describe('WorkspacePane Component', () => {
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
  })

  it('renders dedicated Layer Tree with active count badge and expand/collapse actions', () => {
    render(<WorkspacePane />)

    expect(screen.getByTestId('workspace-pane')).toBeInTheDocument()
    expect(screen.getByTestId('layers-count-badge')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-view')).toBeInTheDocument()

    // Test Toggle Collapse All / Expand All button
    const toggleBtn = screen.getByTestId('toggle-collapse-all-btn')
    expect(toggleBtn).toHaveTextContent('Collapse All')

    // Click toggle to Collapse All
    fireEvent.click(toggleBtn)
    // Master Output and its top-level children remain visible
    expect(screen.getByTestId('layer-tree-item-master-frame-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-source-buffer')).toBeInTheDocument()
    // Non-top-level buffer's child should be hidden
    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()
    expect(toggleBtn).toHaveTextContent('Expand All')

    // Click toggle again to Expand All
    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
    expect(toggleBtn).toHaveTextContent('Collapse All')

    // Test Collapse All
    const collapseAllBtn = screen.getByTestId('collapse-all-layers-btn')
    fireEvent.click(collapseAllBtn)

    // Master Output and top-level children stay visible, only nested child hidden
    expect(screen.getByTestId('layer-tree-item-source-buffer')).toBeInTheDocument()
    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()

    // Test Expand All
    const expandAllBtn = screen.getByTestId('expand-all-layers-btn')
    fireEvent.click(expandAllBtn)

    // Synth child should be visible again
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()
  })

  it('renders Copy JSON button and writes graph layout to clipboard and window global', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<WorkspacePane />)

    const copyBtn = screen.getByTestId('graph-copy-json-button')
    expect(copyBtn).toBeInTheDocument()
    expect(copyBtn).toHaveTextContent('Copy JSON')

    // Test window global helper
    const getLayout = (window as unknown as { __getGraphLayout?: () => { nodes: unknown[]; edges: unknown[] } }).__getGraphLayout
    expect(typeof getLayout).toBe('function')
    const layoutObj = getLayout!()
    expect(Array.isArray(layoutObj.nodes)).toBe(true)
    expect(Array.isArray(layoutObj.edges)).toBe(true)

    // Click Copy JSON
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedJsonStr = writeTextMock.mock.calls[0][0] as string
    const parsed = JSON.parse(copiedJsonStr)
    expect(parsed.nodes).toBeDefined()
    expect(parsed.edges).toBeDefined()
    expect(parsed.timestamp).toBeDefined()

    // Button should show Copied! state
    expect(screen.getByTestId('graph-copy-json-button')).toHaveTextContent('Copied!')
  })

  it('dismisses the add child layer dialog when pressing esc key', () => {
    render(<LayerTreeView />)

    const addBtn = screen.getByTestId('tree-add-child-btn-master-frame-buffer')
    expect(addBtn).toBeInTheDocument()

    // Dialog menu should initially be closed
    expect(screen.queryByTestId('tree-add-child-menu-master-frame-buffer')).not.toBeInTheDocument()

    // Click '+' button to open dialog
    fireEvent.click(addBtn)
    expect(screen.getByTestId('tree-add-child-menu-master-frame-buffer')).toBeInTheDocument()

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' })

    // Dialog menu should now be dismissed
    expect(screen.queryByTestId('tree-add-child-menu-master-frame-buffer')).not.toBeInTheDocument()
  })

  it('dismisses the add child layer dialog when clicking outside of it', () => {
    render(<LayerTreeView />)

    const addBtn = screen.getByTestId('tree-add-child-btn-master-frame-buffer')

    // Click '+' button to open dialog
    fireEvent.click(addBtn)
    const dialogMenu = screen.getByTestId('tree-add-child-menu-master-frame-buffer')
    expect(dialogMenu).toBeInTheDocument()

    // Clicking inside the dialog does not dismiss it
    fireEvent.pointerDown(dialogMenu)
    expect(screen.getByTestId('tree-add-child-menu-master-frame-buffer')).toBeInTheDocument()

    // Clicking outside on document dismisses it
    fireEvent.pointerDown(document.body)
    expect(screen.queryByTestId('tree-add-child-menu-master-frame-buffer')).not.toBeInTheDocument()

    // Test with mousedown as well
    fireEvent.click(addBtn)
    expect(screen.getByTestId('tree-add-child-menu-master-frame-buffer')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('tree-add-child-menu-master-frame-buffer')).not.toBeInTheDocument()
  })

  it('shows confirmation dialog when deleting a container with children and deletes recursively upon confirmation', () => {
    render(<LayerTreeView />)

    // source-buffer has child synth-child
    const deleteSourceBtn = screen.getByTestId('tree-delete-btn-source-buffer')
    fireEvent.click(deleteSourceBtn)

    // Warning confirmation modal should appear
    expect(screen.getByTestId('delete-container-modal-header')).toBeInTheDocument()
    expect(screen.getByText(/Deleting container layer/)).toBeInTheDocument()
    expect(screen.getAllByText(/Source Buffer/).length).toBeGreaterThanOrEqual(2)

    // Cancel deletion
    const cancelBtn = screen.getByTestId('cancel-delete-container-btn')
    fireEvent.click(cancelBtn)
    expect(screen.queryByTestId('delete-container-modal-header')).not.toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-source-buffer')).toBeInTheDocument()
    expect(screen.getByTestId('layer-tree-item-synth-child')).toBeInTheDocument()

    // Click delete again and confirm
    fireEvent.click(deleteSourceBtn)
    expect(screen.getByTestId('delete-container-modal-header')).toBeInTheDocument()
    const confirmBtn = screen.getByTestId('confirm-delete-container-btn')
    fireEvent.click(confirmBtn)

    // Both source-buffer and its child synth-child should be deleted from the store
    expect(screen.queryByTestId('layer-tree-item-source-buffer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()
  })

  it('deletes a leaf node immediately without showing confirmation modal', () => {
    render(<LayerTreeView />)

    // synth-child has no children
    const deleteLeafBtn = screen.getByTestId('tree-delete-btn-synth-child')
    fireEvent.click(deleteLeafBtn)

    // No modal shown, immediately deleted
    expect(screen.queryByTestId('delete-container-modal-header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('layer-tree-item-synth-child')).not.toBeInTheDocument()
  })
})
