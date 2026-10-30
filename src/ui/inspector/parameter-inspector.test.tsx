import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    expect(parentSelect).toHaveValue('source-buffer')

    // Change to 'fb-target'
    fireEvent.change(parentSelect, { target: { value: 'fb-target' } })

    const updatedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(updatedNode?.parentId).toBe('fb-target')
    expect(updatedNode?.extent).toBe('parent')

    // Change back to 'source-buffer'
    fireEvent.change(parentSelect, { target: { value: 'source-buffer' } })

    const reparentedNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual-1')
    expect(reparentedNode?.parentId).toBe('source-buffer')
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
    expect(updatedNode?.data.blendMode).toBe('add')
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

  it('allows uploading an image file and encodes it into node data and serialized JSON', async () => {
    // Add a Static Image node and select it
    useAppStore.getState().addGraphNode({
      id: 'img-upload-test',
      type: 'staticImage',
      parentId: 'master-frame-buffer',
      position: { x: 0, y: 0 },
      data: {
        label: 'Custom Texture',
        imageUrl: '',
        fitMode: 'cover',
      },
    })
    useAppStore.setState({ selectedNodeId: 'img-upload-test' })

    render(<ParameterInspector />)

    expect(screen.getByText('Custom Texture')).toBeInTheDocument()
    expect(screen.getByText('Image Texture File')).toBeInTheDocument()
    expect(screen.getByTestId('static-image-upload-dropzone')).toBeInTheDocument()
    expect(screen.getByText(/Upload Image \(Drop or Browse\)\.\.\./i)).toBeInTheDocument()

    const fileInput = screen.getByTestId('static-image-file-input') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    // Mock FileReader.prototype.readAsDataURL
    const fakeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const mockFile = new File(['fake-image-bytes'], 'artwork.png', { type: 'image/png' })

    const originalFileReader = window.FileReader
    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: fakeBase64 } })
          }
        }, 10)
      }
    }
    window.FileReader = MockFileReader as unknown as typeof FileReader

    try {
      act(() => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } })
      })

      // Wait for async reader to complete and store to update
      await waitFor(() => {
        const updatedNode = useAppStore
          .getState()
          .graphNodes.find((n) => n.id === 'img-upload-test')
        expect(updatedNode?.data.imageUrl).toBe(fakeBase64)
      })

      // Check Zustand store state
      const updatedNode = useAppStore
        .getState()
        .graphNodes.find((n) => n.id === 'img-upload-test')
      expect(updatedNode?.data.imageUrl).toBe(fakeBase64)
      expect(updatedNode?.data.imageFileName).toBe('artwork.png')

      // Check that JSON serialization contains the encoded base64 image
      const serializedJson = JSON.stringify(useAppStore.getState().graphNodes)
      expect(serializedJson).toContain(fakeBase64)
      expect(serializedJson).toContain('artwork.png')

      // Clear the image
      const clearBtn = screen.getByTestId('static-image-clear-button')
      expect(clearBtn).toBeInTheDocument()
      act(() => {
        fireEvent.click(clearBtn)
      })

      const clearedNode = useAppStore
        .getState()
        .graphNodes.find((n) => n.id === 'img-upload-test')
      expect(clearedNode?.data.imageUrl).toBe('')
      expect(clearedNode?.data.imageFileName).toBe('')
    } finally {
      window.FileReader = originalFileReader
    }
  })

  it('supports drag and drop image file upload into dropzone', async () => {
    useAppStore.getState().addGraphNode({
      id: 'img-dnd-test',
      type: 'staticImage',
      parentId: 'master-frame-buffer',
      position: { x: 0, y: 0 },
      data: {
        label: 'Dropzone Texture',
        imageUrl: '',
      },
    })
    useAppStore.setState({ selectedNodeId: 'img-dnd-test' })

    render(<ParameterInspector />)

    const dropzone = screen.getByTestId('static-image-upload-dropzone')
    const fakeDataUrl = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
    const mockFile = new File(['<svg></svg>'], 'vector.svg', { type: 'image/svg+xml' })

    const originalFileReader = window.FileReader
    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: fakeDataUrl } })
          }
        }, 10)
      }
    }
    window.FileReader = MockFileReader as unknown as typeof FileReader

    try {
      act(() => {
        fireEvent.dragOver(dropzone)
      })

      act(() => {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [mockFile],
          },
        })
      })

      await waitFor(() => {
        const updatedNode = useAppStore
          .getState()
          .graphNodes.find((n) => n.id === 'img-dnd-test')
        expect(updatedNode?.data.imageUrl).toBe(fakeDataUrl)
      })

      const updatedNode = useAppStore
        .getState()
        .graphNodes.find((n) => n.id === 'img-dnd-test')
      expect(updatedNode?.data.imageUrl).toBe(fakeDataUrl)
      expect(updatedNode?.data.imageFileName).toBe('vector.svg')
    } finally {
      window.FileReader = originalFileReader
    }
  })
})
