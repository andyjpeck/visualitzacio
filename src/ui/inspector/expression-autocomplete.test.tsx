import { fireEvent, render, screen } from '@testing-library/react'
import React, { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ExpressionAutocomplete } from './expression-autocomplete'

function AutocompleteTestWrapper({
  initialValue = '',
  onChange,
}: {
  initialValue?: string
  onChange: (val: string) => void
}) {
  const [val, setVal] = React.useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (newVal: string) => {
    setVal(newVal)
    onChange(newVal)
  }

  return (
    <div>
      <input
        ref={inputRef}
        data-testid="test-formula-input"
        value={val}
        onChange={(e) => handleChange(e.target.value)}
      />
      <ExpressionAutocomplete
        value={val}
        onChange={handleChange}
        inputRef={inputRef}
      />
    </div>
  )
}

describe('ExpressionAutocomplete Component', () => {
  it('triggers autocomplete dropdown on $ and lists system variables', () => {
    const onChange = vi.fn()
    render(<AutocompleteTestWrapper initialValue="1.0 + $" onChange={onChange} />)

    const dropdown = screen.getByTestId('expression-autocomplete-dropdown')
    expect(dropdown).toBeInTheDocument()
    expect(screen.getByText('System Variables ($)')).toBeInTheDocument()
    expect(screen.getByTestId('autocomplete-item-$BASS')).toBeInTheDocument()
    expect(screen.getByTestId('autocomplete-item-$MID')).toBeInTheDocument()
  })

  it('triggers autocomplete dropdown on # and lists system functions', () => {
    const onChange = vi.fn()
    render(<AutocompleteTestWrapper initialValue="1.0 + #" onChange={onChange} />)

    const dropdown = screen.getByTestId('expression-autocomplete-dropdown')
    expect(dropdown).toBeInTheDocument()
    expect(screen.getByText('System Functions (#)')).toBeInTheDocument()
    expect(screen.getByTestId('autocomplete-item-#BEAT(decay)')).toBeInTheDocument()
    expect(screen.getByTestId('autocomplete-item-#FFT(band, width)')).toBeInTheDocument()
  })

  it('inserts selected variable on item click', () => {
    const onChange = vi.fn()
    render(<AutocompleteTestWrapper initialValue="1.0 + $B" onChange={onChange} />)

    const bassItem = screen.getByTestId('autocomplete-item-$BASS')
    fireEvent.click(bassItem)

    expect(onChange).toHaveBeenCalledWith('1.0 + $BASS')
  })

  it('triggers autocomplete dropdown on local variable prefix when includeDuperscopeVars is true', () => {
    const handleChange = vi.fn()
    function DuperscopeAutocompleteWrapper() {
      const [val, setVal] = React.useState('line')
      const inputRef = useRef<HTMLInputElement>(null)

      return (
        <div>
          <input
            ref={inputRef}
            data-testid="duperscope-code-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <ExpressionAutocomplete
            value={val}
            onChange={(newVal) => {
              setVal(newVal)
              handleChange(newVal)
            }}
            inputRef={inputRef}
            includeDuperscopeVars={true}
          />
        </div>
      )
    }

    render(<DuperscopeAutocompleteWrapper />)

    const dropdown = screen.getByTestId('expression-autocomplete-dropdown')
    expect(dropdown).toBeInTheDocument()
    expect(screen.getByText('Duperscope Variables')).toBeInTheDocument()
    expect(screen.getByTestId('autocomplete-item-linesize')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('autocomplete-item-linesize'))
    expect(handleChange).toHaveBeenCalledWith('linesize')
  })
})
