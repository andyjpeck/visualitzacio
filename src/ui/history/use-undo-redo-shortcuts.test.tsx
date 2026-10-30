import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUndoRedoShortcuts } from './use-undo-redo-shortcuts'
import { useAppStore } from '../store/app-store'

function TestComponent() {
  useUndoRedoShortcuts()
  return (
    <div>
      <input data-testid="text-input" type="text" />
      <input data-testid="range-slider" type="range" />
      <textarea data-testid="textarea-input" />
      <div data-testid="regular-element" tabIndex={0}>Canvas</div>
    </div>
  )
}

describe('useUndoRedoShortcuts Hook', () => {
  beforeEach(() => {
    useAppStore.setState({
      canUndo: true,
      canRedo: true,
    })
  })

  it('triggers undo on Ctrl+Z and redo on Ctrl+Y when not inside a text input', () => {
    const undoMock = vi.fn()
    const redoMock = vi.fn()
    useAppStore.setState({
      undo: undoMock,
      redo: redoMock,
    })

    render(<TestComponent />)

    // Ctrl+Z
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(undoMock).toHaveBeenCalledTimes(1)

    // Ctrl+Y
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(redoMock).toHaveBeenCalledTimes(1)

    // Ctrl+Shift+Z
    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true })
    expect(redoMock).toHaveBeenCalledTimes(2)
  })

  it('bypasses global undo and redo when active element is a text input or textarea', () => {
    const undoMock = vi.fn()
    const redoMock = vi.fn()
    useAppStore.setState({
      undo: undoMock,
      redo: redoMock,
    })

    const { getByTestId } = render(<TestComponent />)
    const textInput = getByTestId('text-input')
    const textarea = getByTestId('textarea-input')

    // Focused in text input
    fireEvent.keyDown(textInput, { key: 'z', ctrlKey: true })
    expect(undoMock).not.toHaveBeenCalled()

    fireEvent.keyDown(textInput, { key: 'y', ctrlKey: true })
    expect(redoMock).not.toHaveBeenCalled()

    // Focused in textarea
    fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true })
    expect(undoMock).not.toHaveBeenCalled()

    // But focused on range slider allows global undo/redo
    const rangeSlider = getByTestId('range-slider')
    fireEvent.keyDown(rangeSlider, { key: 'z', ctrlKey: true })
    expect(undoMock).toHaveBeenCalledTimes(1)
  })
})
