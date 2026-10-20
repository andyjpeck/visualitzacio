import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReactFlowProvider } from '@xyflow/react'
import { MasterFrameBufferNodeComponent } from './master-frame-buffer-node'
import { FrameBufferNodeComponent } from './frame-buffer-node'
import { StaticImageNodeComponent } from './static-image-node'
import { TestVisualNodeComponent } from './test-visual-node'

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
    expect(screen.getByText('add')).toBeInTheDocument()
    expect(screen.getByText('0.9')).toBeInTheDocument()

    // Test selection styling
    const nodeEl = screen.getByTestId('master-frame-buffer-node')
    expect(nodeEl.className).toContain('border-amber-400')
  })

  it('renders FrameBufferNodeComponent with feedback state, blend mode, and handles', () => {
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
    expect(screen.getByText('@FEEDBACK_TEX')).toBeInTheDocument()
    expect(screen.getByText('screen')).toBeInTheDocument()
    expect(screen.getByText('ON (0.95)')).toBeInTheDocument()
    expect(screen.getByText('@TEXTURE_1')).toBeInTheDocument()
  })

  it('renders StaticImageNodeComponent with thumbnail and fit mode', () => {
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
    expect(screen.getByText('@ART_LAYER')).toBeInTheDocument()
    expect(screen.getByText('contain')).toBeInTheDocument()

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/art.png')
  })

  it('renders TestVisualNodeComponent with shape and audio reactivity status', () => {
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
    expect(screen.getByText('Generative Synth')).toBeInTheDocument()
    expect(screen.getByText('Crystal')).toBeInTheDocument()
    expect(screen.getByText('AUDIO-REACTIVE')).toBeInTheDocument()
  })
})
