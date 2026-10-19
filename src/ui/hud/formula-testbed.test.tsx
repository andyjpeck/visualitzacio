import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { RenderEngine } from '../../engine/render-engine'
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
})
