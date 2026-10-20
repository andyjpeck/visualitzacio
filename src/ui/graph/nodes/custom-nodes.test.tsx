import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReactFlowProvider } from '@xyflow/react'
import { MasterFrameBufferNodeComponent } from './master-frame-buffer-node'
import { FrameBufferNodeComponent } from './frame-buffer-node'
import { StaticImageNodeComponent } from './static-image-node'
import { TestVisualNodeComponent } from './test-visual-node'
import { useAppStore } from '../../store/app-store'

describe('Custom Node Card Components', () => {
  it('renders MasterFrameBufferNodeComponent with crown badge, lock icon, and handles', () => {
    render(
      <ReactFlowProvider>
        <MasterFrameBufferNodeComponent
          id="master-1"
          type="masterFrameBuffer"
          data={{ label: 'Screen Output', blendMode: 'add', opacity: 0.9 }}
          selected={true}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={false}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    expect(screen.getByTestId('master-frame-buffer-node')).toBeInTheDocument()
    expect(screen.getByText('Screen Output')).toBeInTheDocument()
    expect(screen.getByText('Root Frame Buffer')).toBeInTheDocument()

    // Test selection styling
    const nodeEl = screen.getByTestId('master-frame-buffer-node')
    expect(nodeEl.className).toContain('border-amber-400')
  })

  it('renders FrameBufferNodeComponent with display name, component type, and handles', () => {
    render(
      <ReactFlowProvider>
        <FrameBufferNodeComponent
          id="fb-1"
          type="frameBuffer"
          data={{
            label: 'Feedback Pass',
            saveTo: 'FEEDBACK_TEX',
            loadFrom: 'TEXTURE_1',
            blendMode: 'screen',
            feedback: true,
            opacity: 0.95,
          }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    expect(screen.getByTestId('frame-buffer-node')).toBeInTheDocument()
    expect(screen.getByText('Feedback Pass')).toBeInTheDocument()
    expect(screen.getByText('Frame Buffer')).toBeInTheDocument()
    expect(screen.getByTitle('Click to disable feedback loop')).toBeInTheDocument()
  })

  it('renders StaticImageNodeComponent with display name, component type, and handles', () => {
    render(
      <ReactFlowProvider>
        <StaticImageNodeComponent
          id="img-1"
          type="staticImage"
          data={{
            label: 'Background Art',
            imageUrl: 'https://example.com/art.png',
            fitMode: 'contain',
            saveTo: 'ART_LAYER',
          }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    expect(screen.getByTestId('static-image-node')).toBeInTheDocument()
    expect(screen.getByText('Background Art')).toBeInTheDocument()
    expect(screen.getByText('Static Image')).toBeInTheDocument()
    expect(screen.getByTitle('Bypass Node (Disable)')).toBeInTheDocument()
  })

  it('renders TestVisualNodeComponent with display name, component type, and handles', () => {
    render(
      <ReactFlowProvider>
        <TestVisualNodeComponent
          id="test-1"
          type="testVisual"
          data={{
            label: 'Crystal Mesh',
            shape: 'Crystal',
            reactive: true,
          }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    expect(screen.getByTestId('test-visual-node')).toBeInTheDocument()
    expect(screen.getByText('Crystal Mesh')).toBeInTheDocument()
    expect(screen.getByText('Test Visual Synth')).toBeInTheDocument()
    expect(screen.getByTitle('Bypass Node (Disable)')).toBeInTheDocument()
  })

  it('toggles bypass and updates store on TestVisualNodeComponent', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'test-interactive',
          type: 'testVisual',
          position: { x: 0, y: 0 },
          data: { label: 'Synth 1', bypassed: false },
        },
      ],
    })

    render(
      <ReactFlowProvider>
        <TestVisualNodeComponent
          id="test-interactive"
          type="testVisual"
          data={{ label: 'Synth 1', bypassed: false }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    const bypassBtn = screen.getByTitle('Bypass Node (Disable)')
    fireEvent.click(bypassBtn)

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-interactive')
    expect(updatedNode?.data.bypassed).toBe(true)
  })

  it('toggles feedback and bypass on FrameBufferNodeComponent', () => {
    useAppStore.setState({
      selectedNodeId: null,
      focusedParamKey: null,
      graphNodes: [
        {
          id: 'fb-interactive',
          type: 'frameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'FX Pass', feedback: false, bypassed: false },
        },
      ],
    })

    render(
      <ReactFlowProvider>
        <FrameBufferNodeComponent
          id="fb-interactive"
          type="frameBuffer"
          data={{ label: 'FX Pass', feedback: false, bypassed: false }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    // Toggle feedback directly from card
    const feedbackChip = screen.getByTitle('Click to enable feedback loop')
    fireEvent.click(feedbackChip)

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'fb-interactive')
    expect(updatedNode?.data.feedback).toBe(true)
    expect(useAppStore.getState().selectedNodeId).toBe('fb-interactive')
    expect(useAppStore.getState().focusedParamKey).toBe('feedback')
  })

  it('renders nested child count badge when node has nested child nodes', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'container-fb',
          type: 'frameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Nested Stage' },
        },
        {
          id: 'child-synth',
          parentId: 'container-fb',
          type: 'testVisual',
          position: { x: 20, y: 40 },
          data: { label: 'Child Synth' },
        },
      ],
    })

    render(
      <ReactFlowProvider>
        <FrameBufferNodeComponent
          id="container-fb"
          type="frameBuffer"
          data={{ label: 'Nested Stage' }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    expect(screen.getByText('1 NESTED')).toBeInTheDocument()
    expect(screen.getByText('Nested Stage')).toBeInTheDocument()
    expect(screen.getByText('Frame Buffer')).toBeInTheDocument()
  })

  it('adds a child synth inside MasterFrameBufferNodeComponent via + button', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
      ],
      selectedNodeId: null,
    })

    render(
      <ReactFlowProvider>
        <MasterFrameBufferNodeComponent
          id="master-frame-buffer"
          type="masterFrameBuffer"
          data={{ label: 'Master Output' }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={false}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    const addBtn = screen.getByTestId('master-add-child-button')
    fireEvent.click(addBtn)

    expect(screen.getByTestId('master-add-child-menu')).toBeInTheDocument()

    const addSynthBtn = screen.getByTestId('master-add-child-synth')
    fireEvent.click(addSynthBtn)

    const nodes = useAppStore.getState().graphNodes
    const addedChild = nodes.find((n) => n.parentId === 'master-frame-buffer')
    expect(addedChild).toBeDefined()
    expect(addedChild?.type).toBe('testVisual')
    expect(addedChild?.extent).toBe('parent')
    expect(useAppStore.getState().selectedNodeId).toBe(addedChild?.id)
  })

  it('adds a child image inside FrameBufferNodeComponent via + button', () => {
    useAppStore.setState({
      graphNodes: [
        {
          id: 'custom-fb',
          type: 'frameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Custom FB' },
        },
      ],
      selectedNodeId: null,
    })

    render(
      <ReactFlowProvider>
        <FrameBufferNodeComponent
          id="custom-fb"
          type="frameBuffer"
          data={{ label: 'Custom FB' }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          selectable={true}
          deletable={true}
          draggable={true}
        />
      </ReactFlowProvider>,
    )

    const addBtn = screen.getByTestId('fb-add-child-button')
    fireEvent.click(addBtn)

    expect(screen.getByTestId('fb-add-child-menu')).toBeInTheDocument()

    const addImageBtn = screen.getByTestId('fb-add-child-image')
    fireEvent.click(addImageBtn)

    const nodes = useAppStore.getState().graphNodes
    const addedChild = nodes.find((n) => n.parentId === 'custom-fb')
    expect(addedChild).toBeDefined()
    expect(addedChild?.type).toBe('staticImage')
    expect(addedChild?.extent).toBe('parent')
  })
})
