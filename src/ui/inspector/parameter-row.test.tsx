import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ParameterRow } from './parameter-row'

describe('ParameterRow Component', () => {
  it('renders fixed slider control by default and calls onChange on adjustment', () => {
    const handleChange = vi.fn()

    render(
      <ParameterRow
        label="Opacity"
        value={0.8}
        min={0}
        max={1}
        step={0.01}
        type="slider"
        onChange={handleChange}
      />,
    )

    expect(screen.getByText('Opacity')).toBeInTheDocument()
    const slider = screen.getByLabelText('Opacity')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveValue('0.8')

    // Adjust slider
    fireEvent.change(slider, { target: { value: '0.95' } })
    expect(handleChange).toHaveBeenCalledWith(0.95, 'fixed')
  })

  it('morphs into expression mode when clicking f(x) button', () => {
    const handleChange = vi.fn()

    const { rerender } = render(
      <ParameterRow
        label="Scale"
        value={1.0}
        type="slider"
        onChange={handleChange}
      />,
    )

    const fxToggle = screen.getByTestId('fx-toggle-scale')
    expect(fxToggle).toBeInTheDocument()

    // Click f(x) toggle
    fireEvent.click(fxToggle)
    expect(handleChange).toHaveBeenCalledWith('1', 'expression')

    // Rerender with expression value
    rerender(
      <ParameterRow
        label="Scale"
        value="1.0 + $BASS * 0.8"
        mode="expression"
        type="slider"
        onChange={handleChange}
      />,
    )

    // Formula input and sparkline should now be rendered
    const input = screen.getByPlaceholderText('e.g. 1.0 + $BASS * 0.8')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('1.0 + $BASS * 0.8')
    expect(screen.getByText('Syntax Valid')).toBeInTheDocument()
  })

  it('retains expression mode internally after clicking f(x) even when rerendered with plain string value', () => {
    const handleChange = vi.fn()

    const { rerender } = render(
      <ParameterRow
        label="Scale"
        value={1.0}
        type="slider"
        onChange={handleChange}
      />,
    )

    const fxToggle = screen.getByTestId('fx-toggle-scale')
    fireEvent.click(fxToggle)
    expect(handleChange).toHaveBeenCalledWith('1', 'expression')

    // Rerender with plain '1' without explicit mode prop
    rerender(
      <ParameterRow
        label="Scale"
        value="1"
        type="slider"
        onChange={handleChange}
      />,
    )

    // Formula input should be visible and active
    const input = screen.getByPlaceholderText('e.g. 1.0 + $BASS * 0.8')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('1')
  })

  it('preserves formula when closing and re-opening the f(x) window', () => {
    const handleChange = vi.fn()

    const { rerender } = render(
      <ParameterRow
        label="Scale"
        value={1.0}
        type="slider"
        onChange={handleChange}
      />,
    )

    const fxToggle = screen.getByTestId('fx-toggle-scale')
    fireEvent.click(fxToggle)
    expect(handleChange).toHaveBeenCalledWith('1', 'expression')

    // Simulate store update with formula
    rerender(
      <ParameterRow
        label="Scale"
        value="sin($TIME) * 0.5 + 1.0"
        type="slider"
        onChange={handleChange}
      />,
    )

    expect(screen.getByDisplayValue('sin($TIME) * 0.5 + 1.0')).toBeInTheDocument()

    // Close the f(x) window by clicking Close f(x) Window button
    const closeBtn = screen.getByTestId('fx-close-button-scale')
    fireEvent.click(closeBtn)

    // Formula MUST NOT be cleared and collapsed summary is shown
    expect(screen.getByTestId('fx-collapsed-scale')).toBeInTheDocument()
    expect(screen.getByText('sin($TIME) * 0.5 + 1.0')).toBeInTheDocument()

    // Re-open f(x) window by clicking the collapsed summary
    fireEvent.click(screen.getByTestId('fx-collapsed-scale'))
    expect(screen.getByDisplayValue('sin($TIME) * 0.5 + 1.0')).toBeInTheDocument()
  })

  it('renders dropdown options for dropdown parameter type', () => {
    const handleChange = vi.fn()
    const options = [
      { label: 'Replace', value: 'replace' },
      { label: 'Screen', value: 'screen' },
      { label: 'Add', value: 'add' },
    ]

    render(
      <ParameterRow
        label="Blend Mode"
        value="screen"
        type="dropdown"
        options={options}
        allowExpression={false}
        onChange={handleChange}
      />,
    )

    const select = screen.getByLabelText('Blend Mode')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('screen')

    fireEvent.change(select, { target: { value: 'add' } })
    expect(handleChange).toHaveBeenCalledWith('add', 'fixed')
  })

  it('renders toggle button for boolean parameter type', () => {
    const handleChange = vi.fn()

    render(
      <ParameterRow
        label="Feedback Loop"
        value={true}
        type="toggle"
        allowExpression={false}
        onChange={handleChange}
      />,
    )

    const toggleBtn = screen.getByRole('button', { name: 'Feedback Loop' })
    expect(toggleBtn).toHaveTextContent('ENABLED')

    fireEvent.click(toggleBtn)
    expect(handleChange).toHaveBeenCalledWith(false, 'fixed')
  })
})
