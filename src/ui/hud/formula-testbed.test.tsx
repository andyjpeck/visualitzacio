import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { RenderEngine } from '../../engine/render-engine'
import { TestVisualNode } from '../../engine/visual-node'
import { useAppStore } from '../store/app-store'
import { FormulaTestbed } from './formula-testbed'

describe('FormulaTestbed Component', () => {
  let mockEngine: RenderEngine

  beforeEach(() => {
    useAppStore.setState({
      isFormulaTestbedOpen: true,
      activeFormula: '1.0 + $BASS * 0.8',
      bindFormulaToScene: true,
    })

    const ctx = createDefaultFrameContext()
    ctx.$BASS = 0.5
    ctx.$TIME = 1.0

    mockEngine = {
      getFrameContext: () => ctx,
      getNodes: () => [],
    } as unknown as RenderEngine

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    })) as any)
  })

  it('renders formula input, validation status, and presets when open', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    expect(screen.getByText(/Dynamic Expression Testbed/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('1.0 + $BASS * 0.8')).toBeInTheDocument()
    expect(screen.getByText('Syntax Valid')).toBeInTheDocument()
    expect(screen.getByText('Bass Pulsar')).toBeInTheDocument()
    expect(screen.getByText('Beat Shockwave')).toBeInTheDocument()
  })

  it('updates activeFormula when user types into the input', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'sin($TIME) * 2.0' } })

    expect(useAppStore.getState().activeFormula).toBe('sin($TIME) * 2.0')
    expect(screen.getByText('Syntax Valid')).toBeInTheDocument()
  })

  it('displays syntax error status when formula is invalid', () => {
    useAppStore.setState({ activeFormula: 'invalid + * syntax' })
    render(<FormulaTestbed engine={mockEngine} />)
    expect(screen.getByText('Syntax Error')).toBeInTheDocument()
  })

  it('sets formula when a preset chip is clicked', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const shockwaveBtn = screen.getByText('Beat Shockwave')
    fireEvent.click(shockwaveBtn)

    expect(useAppStore.getState().activeFormula).toBe('#BEAT(0.2) * 2.0')
  })

  it('toggles bindFormulaToScene checkbox', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(useAppStore.getState().bindFormulaToScene).toBe(false)
  })

  it('closes when close button is clicked', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const closeBtn = screen.getByLabelText('Close formula testbed')
    fireEvent.click(closeBtn)

    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(false)
  })

  it('closes on Escape key press', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(useAppStore.getState().isFormulaTestbedOpen).toBe(false)
  })

  it('renders nothing when closed', () => {
    useAppStore.setState({ isFormulaTestbedOpen: false })
    const { container } = render(<FormulaTestbed engine={mockEngine} />)
    expect(container.firstChild).toBeNull()
  })

  it('allows dragging the dialog by its header', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const header = screen.getByTestId('formula-dialog-header')
    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveStyle({ position: 'fixed' })
    const initialLeft = parseInt(dialog.style.left, 10)
    const initialTop = parseInt(dialog.style.top, 10)

    // Simulate dragging
    fireEvent.pointerDown(header, { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientX: 180, clientY: 150, pointerId: 1 })
    fireEvent.pointerUp(header, { pointerId: 1 })

    const newLeft = parseInt(dialog.style.left, 10)
    const newTop = parseInt(dialog.style.top, 10)

    expect(newLeft).toBe(initialLeft + 80)
    expect(newTop).toBe(initialTop + 50)
  })

  it('rejects misspelled function "#BEAzT(0.2f) * 2.0" and displays syntax error details', () => {
    useAppStore.setState({ activeFormula: '#BEAzT(0.2f) * 2.0' })
    render(<FormulaTestbed engine={mockEngine} />)

    expect(screen.getByText('Syntax Error')).toBeInTheDocument()
    expect(screen.getByText(/Unknown system function: #BEAzT/i)).toBeInTheDocument()
  })

  it('toggles collapsible presets section and updates aria-expanded', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const toggleBtn = screen.getByTestId('toggle-formula-presets')
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Bass Pulsar')).toBeInTheDocument()

    // Collapse presets
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Bass Pulsar')).not.toBeInTheDocument()
    expect(useAppStore.getState().isFormulaPresetsOpen).toBe(false)

    // Expand presets
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Bass Pulsar')).toBeInTheDocument()
    expect(useAppStore.getState().isFormulaPresetsOpen).toBe(true)
  })

  it('toggles collapsible quick reference section and updates aria-expanded', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const toggleBtn = screen.getByTestId('toggle-formula-reference')
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('var-item-BASS')).toBeInTheDocument()

    // Collapse reference
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('var-item-BASS')).not.toBeInTheDocument()
    expect(useAppStore.getState().isFormulaReferenceOpen).toBe(false)

    // Expand reference
    fireEvent.click(toggleBtn)
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('var-item-BASS')).toBeInTheDocument()
    expect(useAppStore.getState().isFormulaReferenceOpen).toBe(true)
  })

  it('renders tooltips over quick reference VAR and FUNC items and allows inserting them', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const bassChip = screen.getByTestId('var-item-BASS')
    const beatFuncChip = screen.getByTestId('func-item-BEATdecay')

    expect(bassChip).toHaveAttribute('title', expect.stringContaining('$BASS: Audio bass energy'))
    expect(beatFuncChip).toHaveAttribute('title', expect.stringContaining('#BEAT'))

    // Click to append token into formula
    fireEvent.click(bassChip)
    expect(useAppStore.getState().activeFormula).toBe('1.0 + $BASS * 0.8 + $BASS')
  })

  it('renders real-time line chart canvas, min and peak scale readouts instead of telemetry ticker', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    expect(screen.getByTestId('formula-line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('formula-chart-min')).toBeInTheDocument()
    expect(screen.getByTestId('formula-chart-peak')).toBeInTheDocument()
    expect(screen.getByText(/Real-Time Plot/i)).toBeInTheDocument()

    // Confirm old telemetry ticker is not in this dialog
    expect(screen.queryByText('$TIME:')).not.toBeInTheDocument()
  })

  it('renders Quick Reference above Example Formula Presets in document order', () => {
    render(<FormulaTestbed engine={mockEngine} />)
    const refToggle = screen.getByTestId('toggle-formula-reference')
    const presetsToggle = screen.getByTestId('toggle-formula-presets')

    // refToggle should appear before presetsToggle in DOM order
    expect(refToggle.compareDocumentPosition(presetsToggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('clears line chart history buffer when panel is closed to prevent memory leaks', () => {
    let currentRafCallback: FrameRequestCallback | null = null
    const originalRaf = window.requestAnimationFrame
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      currentRafCallback = cb
      return 123
    }

    try {
      const historyLengthRef = { current: 0 }
      const { unmount } = render(
        <FormulaTestbed engine={mockEngine} historyLengthRef={historyLengthRef} />
      )

      // Simulate animation frame ticks
      if (currentRafCallback) {
        ;(currentRafCallback as (time: number) => void)(16)
      }
      expect(historyLengthRef.current).toBe(1)

      if (currentRafCallback) {
        ;(currentRafCallback as (time: number) => void)(32)
      }
      expect(historyLengthRef.current).toBe(2)

      // When panel is closed, history buffer is cleared and tracking stops
      act(() => {
        useAppStore.setState({ isFormulaTestbedOpen: false })
      })
      expect(historyLengthRef.current).toBe(0)

      // Unmounting also cleans up
      unmount()
      expect(historyLengthRef.current).toBe(0)
    } finally {
      window.requestAnimationFrame = originalRaf
    }
  })

  it('binds dynamic expression to nested TestVisualNode inside container nodes (regression test)', () => {
    const setScaleExpressionSpy = vi.fn()
    const mockTestVisualNode = {
      setScaleExpression: setScaleExpressionSpy,
    }

    // Mock an engine where TestVisualNode is nested inside a container (like FrameBufferNode)
    const hierarchicalEngine = {
      getFrameContext: () => createDefaultFrameContext(),
      getNodes: () => [], // top-level nodes array might not have TestVisualNode directly
      getAllNodes: () => [mockTestVisualNode], // getAllNodes traverses hierarchy
    } as unknown as RenderEngine

    // Use prototype check compatibility by setting mockTestVisualNode prototype
    Object.setPrototypeOf(mockTestVisualNode, TestVisualNode.prototype)

    const { rerender } = render(<FormulaTestbed engine={hierarchicalEngine} />)

    // Initially bound
    expect(setScaleExpressionSpy).toHaveBeenCalledWith('1.0 + $BASS * 0.8', expect.anything())

    // Changing active formula updates the nested TestVisualNode
    act(() => {
      useAppStore.setState({ activeFormula: 'sin($TIME) * 1.5' })
    })
    rerender(<FormulaTestbed engine={hierarchicalEngine} />)

    expect(setScaleExpressionSpy).toHaveBeenCalledWith('sin($TIME) * 1.5', expect.anything())
  })
})
