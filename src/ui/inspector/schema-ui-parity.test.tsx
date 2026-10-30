import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParameterInspector } from './parameter-inspector'
import { useAppStore } from '../store/app-store'
import type {
  BaseNodeData,
  MasterFrameBufferNodeData,
  FrameBufferNodeData,
  StaticImageNodeData,
  DuperscopeNodeData,
  TestVisualNodeData,
} from '../graph/node-data'
import { ALL_NODE_TYPES, type AllNodeType } from '../../contracts/node-types'

/**
 * Compile-time enforcement helper:
 * Every parameter defined on a node's data contract must map either to:
 * - A string UI label rendered in ParameterInspector
 * - null if intentionally exempted in EXEMPT_PARAMS (with rationale)
 *
 * If a developer adds a property to any NodeData interface without updating
 * this map, TypeScript will immediately throw a compilation error.
 */
type ParamUIMap<T> = {
  [K in keyof Required<Omit<T, keyof BaseNodeData>>]: string | null
}

const MASTER_FRAME_BUFFER_PARAM_MAP: ParamUIMap<MasterFrameBufferNodeData> = {
  inputBlendMode: 'Input Blend Mode',
  outputBlendMode: 'Output Blend Mode',
  opacity: 'Opacity',
  scale: 'Scale',
  scaleX: 'Scale X',
  scaleY: 'Scale Y',
  flipX: 'Flip X',
  flipY: 'Flip Y',
  rotation: 'Rotation',
  positionX: 'Offset X',
  positionY: 'Offset Y',
  loadFrom: 'Sample Input (@NAME)',
  // Intentional exemptions:
  resolutionScale: null, // Preset-wide setting configured in performance popover/settings modal
  blendMode: null, // Backward compatibility alias for outputBlendMode
  offsetX: null, // Alias for positionX (Offset X control)
  offsetY: null, // Alias for positionY (Offset Y control)
}

const FRAME_BUFFER_PARAM_MAP: ParamUIMap<FrameBufferNodeData> = {
  inputBlendMode: 'Input Blend Mode',
  outputBlendMode: 'Output Blend Mode',
  opacity: 'Opacity',
  scale: 'Scale',
  scaleX: 'Scale X',
  scaleY: 'Scale Y',
  flipX: 'Flip X',
  flipY: 'Flip Y',
  feedback: 'Feedback Loop',
  rotation: 'Rotation',
  positionX: 'Offset X',
  positionY: 'Offset Y',
  saveTo: 'Publish Output (@NAME)',
  loadFrom: 'Sample Input (@NAME)',
  // Intentional exemptions:
  appliedTemplateId: null, // Selected via component preset dropdown header, not a parameter row
  blendMode: null, // Backward compatibility alias for outputBlendMode
  offsetX: null, // Alias for positionX
  offsetY: null, // Alias for positionY
}

const STATIC_IMAGE_PARAM_MAP: ParamUIMap<StaticImageNodeData> = {
  saveTo: 'Publish Output (@NAME)',
  imageUrl: 'Image URL',
  fitMode: 'Fit Mode',
  opacity: 'Opacity',
  // Intentional exemptions:
  imageFileName: null, // Internal metadata for uploaded image asset
}

const DUPERSCOPE_PARAM_MAP: ParamUIMap<DuperscopeNodeData> = {
  drawMode: 'Draw Mode',
  audioMode: 'Audio Mode',
  channel: 'Channel',
  opacity: 'Opacity',
  initCode: 'Init Phase',
  beatCode: 'Beat Phase',
  frameCode: 'Frame Phase',
  pointCode: 'Point Phase',
  // Intentional exemptions:
  appliedTemplateId: null, // Selected via preset dropdown header, not a parameter row
}

const TEST_VISUAL_PARAM_MAP: ParamUIMap<TestVisualNodeData> = {
  shape: 'Shape',
  reactive: 'Audio Reactive',
  scale: 'Scale',
  positionX: 'Offset X',
  positionY: 'Offset Y',
  // Intentional exemptions:
  offsetX: null, // Alias for positionX
  offsetY: null, // Alias for positionY
}

const SCHEMA_PARAM_MAPPINGS: Record<AllNodeType, Record<string, string | null>> = {
  masterFrameBuffer: MASTER_FRAME_BUFFER_PARAM_MAP,
  frameBuffer: FRAME_BUFFER_PARAM_MAP,
  staticImage: STATIC_IMAGE_PARAM_MAP,
  duperscopeNode: DUPERSCOPE_PARAM_MAP,
  testVisual: TEST_VISUAL_PARAM_MAP,
}

const EXEMPT_REASONS: Record<string, string> = {
  resolutionScale: 'Preset-wide rendering setting adjusted in Preset Settings / FPS badge',
  blendMode: 'Legacy schema alias for outputBlendMode',
  appliedTemplateId: 'Managed through Component Preset dropdown and template modal',
  imageFileName: 'File name tracking for local image uploads and tooltip indicators',
  offsetX: 'Alias for canonical positionX',
  offsetY: 'Alias for canonical positionY',
}

describe('Schema-to-UI Parity Guard Suite (Issue #11)', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedNodeId: 'master-frame-buffer',
      graphNodes: [
        {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          position: { x: 0, y: 0 },
          data: { label: 'Master Output' },
        },
        {
          id: 'child-frame-buffer',
          type: 'frameBuffer',
          parentId: 'master-frame-buffer',
          position: { x: 20, y: 20 },
          data: { label: 'Test Frame Buffer' },
        },
        {
          id: 'test-image',
          type: 'staticImage',
          parentId: 'master-frame-buffer',
          position: { x: 40, y: 40 },
          data: { label: 'Test Static Image' },
        },
        {
          id: 'test-duperscope',
          type: 'duperscopeNode',
          parentId: 'master-frame-buffer',
          position: { x: 60, y: 60 },
          data: { label: 'Test Duperscope' },
        },
        {
          id: 'test-visual',
          type: 'testVisual',
          parentId: 'master-frame-buffer',
          position: { x: 80, y: 80 },
          data: { label: 'Test Visual Synth' },
        },
      ],
      targetFps: 60,
      resolutionScale: 1.0,
    })
  })

  it('covers all registered node types in ALL_NODE_TYPES', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      expect(SCHEMA_PARAM_MAPPINGS[nodeType]).toBeDefined()
    }
  })

  it('verifies all exemptions have documented rationales', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      const map = SCHEMA_PARAM_MAPPINGS[nodeType]
      for (const [paramKey, uiLabel] of Object.entries(map)) {
        if (uiLabel === null) {
          expect(EXEMPT_REASONS[paramKey]).toBeDefined()
          expect(EXEMPT_REASONS[paramKey].length).toBeGreaterThan(10)
        }
      }
    }
  })

  it('renders all MasterFrameBuffer transform & parity parameters in ParameterInspector', () => {
    useAppStore.setState({ selectedNodeId: 'master-frame-buffer' })
    render(<ParameterInspector />)

    const expectedLabels = [
      'Input Blend Mode',
      'Output Blend Mode',
      'Opacity',
      'Scale',
      'Scale X',
      'Scale Y',
      'Flip X',
      'Flip Y',
      'Rotation',
      'Offset X',
      'Offset Y',
      'Sample Input (@NAME)',
    ]

    for (const label of expectedLabels) {
      expect(
        screen.queryByLabelText(label) || screen.queryByText(label),
      ).not.toBeNull()
    }
  })

  it('allows toggling Flip X and Flip Y on Master Output', () => {
    useAppStore.setState({ selectedNodeId: 'master-frame-buffer' })
    render(<ParameterInspector />)

    const flipXToggle = screen.getByLabelText('Flip X')
    expect(flipXToggle).toBeInTheDocument()
    fireEvent.click(flipXToggle)

    const masterNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'master-frame-buffer')
    expect(masterNode?.data.flipX).toBe(true)
  })

  it('renders all FrameBuffer parameters in ParameterInspector', () => {
    useAppStore.setState({ selectedNodeId: 'child-frame-buffer' })
    render(<ParameterInspector />)

    const map = SCHEMA_PARAM_MAPPINGS.frameBuffer
    for (const [paramKey, uiLabel] of Object.entries(map)) {
      if (uiLabel !== null) {
        const el = screen.queryByLabelText(uiLabel) || screen.queryByText(uiLabel)
        expect(el, `Expected UI control for frameBuffer parameter "${paramKey}" with label "${uiLabel}"`).not.toBeNull()
      }
    }
  })

  it('renders all StaticImage parameters in ParameterInspector', () => {
    useAppStore.setState({ selectedNodeId: 'test-image' })
    render(<ParameterInspector />)

    const map = SCHEMA_PARAM_MAPPINGS.staticImage
    for (const [paramKey, uiLabel] of Object.entries(map)) {
      if (uiLabel !== null) {
        const el = screen.queryByLabelText(uiLabel) || screen.queryByText(uiLabel)
        expect(el, `Expected UI control for staticImage parameter "${paramKey}" with label "${uiLabel}"`).not.toBeNull()
      }
    }
  })

  it('renders all Duperscope parameters in ParameterInspector', () => {
    useAppStore.setState({ selectedNodeId: 'test-duperscope' })
    render(<ParameterInspector />)

    const map = SCHEMA_PARAM_MAPPINGS.duperscopeNode
    for (const [paramKey, uiLabel] of Object.entries(map)) {
      if (uiLabel !== null) {
        const el = screen.queryByLabelText(uiLabel) || screen.queryByText(uiLabel)
        expect(el, `Expected UI control for duperscopeNode parameter "${paramKey}" with label "${uiLabel}"`).not.toBeNull()
      }
    }
  })

  it('renders all TestVisual parameters including Audio Reactive toggle in ParameterInspector', () => {
    useAppStore.setState({ selectedNodeId: 'test-visual' })
    render(<ParameterInspector />)

    const map = SCHEMA_PARAM_MAPPINGS.testVisual
    for (const [paramKey, uiLabel] of Object.entries(map)) {
      if (uiLabel !== null) {
        const el = screen.queryByLabelText(uiLabel) || screen.queryByText(uiLabel)
        expect(el, `Expected UI control for testVisual parameter "${paramKey}" with label "${uiLabel}"`).not.toBeNull()
      }
    }

    // Verify Audio Reactive toggle updates store
    const reactiveToggle = screen.getByLabelText('Audio Reactive')
    expect(reactiveToggle).toBeInTheDocument()
    fireEvent.click(reactiveToggle)

    const visualNode = useAppStore
      .getState()
      .graphNodes.find((n) => n.id === 'test-visual')
    expect(visualNode?.data.reactive).toBe(true)
  })
})
