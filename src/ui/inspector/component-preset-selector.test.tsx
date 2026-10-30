import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ParameterInspector } from './parameter-inspector'
import { isNodeDirty } from './component-preset-utils'
import {
  DEFAULT_GRAPH_NODES,
  useAppStore,
} from '../store/app-store'
import type { Node } from '@xyflow/react'

describe('Component Preset Selector & Dirty-State Overwrite Guard (Task 3.4)', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedNodeId: 'master-frame-buffer',
      graphNodes: [...DEFAULT_GRAPH_NODES],
      targetFps: 60,
      resolutionScale: 1.0,
    })
  })

  describe('isNodeDirty helper', () => {
    it('returns false for fresh default clean-slate frame buffer', () => {
      const cleanNode: Node = {
        id: 'fb-clean',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Clean Buffer',
          blendMode: 'replace',
          feedback: false,
          opacity: 1.0,
          scale: 1.0,
          rotation: 0.0,
          positionX: 0.0,
          positionY: 0.0,
        },
      }
      expect(isNodeDirty(cleanNode)).toBe(false)
    })

    it('returns true when feedback is enabled', () => {
      const feedbackNode: Node = {
        id: 'fb-dirty-feedback',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Trails Buffer',
          feedback: true,
        },
      }
      expect(isNodeDirty(feedbackNode)).toBe(true)
    })

    it('returns true when blend mode is non-default', () => {
      const blendNode: Node = {
        id: 'fb-dirty-blend',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Additive Buffer',
          blendMode: 'additive',
        },
      }
      expect(isNodeDirty(blendNode)).toBe(true)
    })

    it('returns true when parameters (opacity, scale, rotation, offset) are modified', () => {
      const opacityNode: Node = {
        id: 'fb-opacity',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Soft Buffer',
          opacity: 0.75,
        },
      }
      expect(isNodeDirty(opacityNode)).toBe(true)

      const scaleNode: Node = {
        id: 'fb-scale',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Zoom Buffer',
          scale: 1.25,
        },
      }
      expect(isNodeDirty(scaleNode)).toBe(true)

      const rotNode: Node = {
        id: 'fb-rot',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Spin Buffer',
          rotation: 0.15,
        },
      }
      expect(isNodeDirty(rotNode)).toBe(true)
    })

    it('returns true when any expression formula is present', () => {
      const formulaNode: Node = {
        id: 'fb-formula',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Dynamic Buffer',
          opacity: 1.0,
          opacity_formula: '1.0 + $BASS * 0.5',
        },
      }
      expect(isNodeDirty(formulaNode)).toBe(true)
    })

    it('returns true when an existing template was already applied', () => {
      const templateNode: Node = {
        id: 'fb-templated',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Preset Buffer',
          appliedTemplateId: 'phosphor-trails',
        },
      }
      expect(isNodeDirty(templateNode)).toBe(true)
    })
  })

  describe('Template Overwrite Confirmation Modal', () => {
    it('applies template immediately to an unmodified node without opening confirmation modal', () => {
      useAppStore.getState().addGraphNode({
        id: 'fb-unmodified',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Fresh Buffer',
          blendMode: 'replace',
          feedback: false,
          opacity: 1.0,
          scale: 1.0,
          rotation: 0.0,
          positionX: 0.0,
          positionY: 0.0,
        },
      })
      useAppStore.setState({ selectedNodeId: 'fb-unmodified' })

      render(<ParameterInspector />)

      const dropdown = screen.getByTestId('component-preset-dropdown')
      fireEvent.change(dropdown, { target: { value: 'phosphor-trails' } })

      // Modal should NOT be open
      expect(screen.queryByText('Overwrite Component Parameters?')).not.toBeInTheDocument()

      // Node should be updated
      const updatedNode = useAppStore.getState().graphNodes.find((n) => n.id === 'fb-unmodified')
      expect(updatedNode?.data.feedback).toBe(true)
      expect(updatedNode?.data.blendMode).toBe('additive')
      expect(updatedNode?.data.appliedTemplateId).toBe('phosphor-trails')
    })

    it('triggers confirmation modal when selecting a template on a modified node', () => {
      useAppStore.getState().addGraphNode({
        id: 'fb-custom',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Custom Vortex',
          blendMode: 'screen',
          feedback: true,
          opacity: 0.85,
          scale: 1.05,
          rotation: 0.04,
        },
      })
      useAppStore.setState({ selectedNodeId: 'fb-custom' })

      render(<ParameterInspector />)

      const dropdown = screen.getByTestId('component-preset-dropdown')
      fireEvent.change(dropdown, { target: { value: 'clean-slate' } })

      // Modal should be displayed
      expect(screen.getByText('Overwrite Component Parameters?')).toBeInTheDocument()
      expect(screen.getByText(/has customized parameters/i)).toBeInTheDocument()
      expect(screen.getByTestId('cancel-overwrite-template-btn')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-overwrite-template-btn')).toBeInTheDocument()

      // Node should NOT be overwritten yet
      const node = useAppStore.getState().graphNodes.find((n) => n.id === 'fb-custom')
      expect(node?.data.feedback).toBe(true)
      expect(node?.data.opacity).toBe(0.85)
    })

    it('cancels template overwrite when clicking Keep Current', () => {
      useAppStore.getState().addGraphNode({
        id: 'fb-cancel-test',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'My Custom Pass',
          blendMode: 'screen',
          feedback: true,
          opacity: 0.77,
        },
      })
      useAppStore.setState({ selectedNodeId: 'fb-cancel-test' })

      render(<ParameterInspector />)

      const dropdown = screen.getByTestId('component-preset-dropdown')
      fireEvent.change(dropdown, { target: { value: 'phosphor-trails' } })

      // Modal opens
      expect(screen.getByText('Overwrite Component Parameters?')).toBeInTheDocument()

      // Click Keep Current
      const cancelBtn = screen.getByTestId('cancel-overwrite-template-btn')
      fireEvent.click(cancelBtn)

      // Modal should be dismissed
      expect(screen.queryByText('Overwrite Component Parameters?')).not.toBeInTheDocument()

      // Node parameters must remain untouched
      const node = useAppStore.getState().graphNodes.find((n) => n.id === 'fb-cancel-test')
      expect(node?.data.blendMode).toBe('screen')
      expect(node?.data.feedback).toBe(true)
      expect(node?.data.opacity).toBe(0.77)
    })

    it('confirms template overwrite when clicking Overwrite & Apply', () => {
      useAppStore.getState().addGraphNode({
        id: 'fb-confirm-test',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Previous Feedback',
          blendMode: 'screen',
          feedback: true,
          opacity: 0.5,
          scale: 0.9,
        },
      })
      useAppStore.setState({ selectedNodeId: 'fb-confirm-test' })

      render(<ParameterInspector />)

      const dropdown = screen.getByTestId('component-preset-dropdown')
      fireEvent.change(dropdown, { target: { value: 'phosphor-trails' } })

      // Modal opens
      expect(screen.getByText('Overwrite Component Parameters?')).toBeInTheDocument()

      // Click Overwrite & Apply
      const confirmBtn = screen.getByTestId('confirm-overwrite-template-btn')
      fireEvent.click(confirmBtn)

      // Modal dismissed
      expect(screen.queryByText('Overwrite Component Parameters?')).not.toBeInTheDocument()

      // Node parameters should now reflect 'phosphor-trails' template
      const node = useAppStore.getState().graphNodes.find((n) => n.id === 'fb-confirm-test')
      expect(node?.data.appliedTemplateId).toBe('phosphor-trails')
      expect(node?.data.feedback).toBe(true)
      expect(node?.data.blendMode).toBe('additive')
      expect(node?.data.opacity).toBe(0.94)
      expect(node?.data.scale).toBe(1.0)
    })

    it('dismisses modal on Escape key without applying changes', () => {
      useAppStore.getState().addGraphNode({
        id: 'fb-escape-test',
        type: 'frameBuffer',
        position: { x: 0, y: 0 },
        data: {
          label: 'Esc Test Buffer',
          blendMode: 'multiply',
          feedback: false,
        },
      })
      useAppStore.setState({ selectedNodeId: 'fb-escape-test' })

      render(<ParameterInspector />)

      const dropdown = screen.getByTestId('component-preset-dropdown')
      fireEvent.change(dropdown, { target: { value: 'feedback-vortex' } })

      expect(screen.getByText('Overwrite Component Parameters?')).toBeInTheDocument()

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' })

      // Modal dismissed
      expect(screen.queryByText('Overwrite Component Parameters?')).not.toBeInTheDocument()

      // Node unchanged
      const node = useAppStore.getState().graphNodes.find((n) => n.id === 'fb-escape-test')
      expect(node?.data.blendMode).toBe('multiply')
      expect(node?.data.appliedTemplateId).toBeUndefined()
    })
  })
})
