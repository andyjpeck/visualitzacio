import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BaseModalDialog } from './base-modal-dialog'
import { useAppStore } from '../store/app-store'
import { Settings } from 'lucide-react'

describe('BaseModalDialog Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      dialogStack: [],
      isPresetSettingsOpen: false,
      isFormulaTestbedOpen: false,
      isTemplateSelectorOpen: false,
    })
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <BaseModalDialog isOpen={false} title="Test Dialog">
        <div>Content</div>
      </BaseModalDialog>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders when isOpen is explicitly true', () => {
    render(
      <BaseModalDialog
        isOpen={true}
        title="Settings Window"
        icon={<Settings data-testid="settings-icon" />}
        closeAriaLabel="Close test settings"
      >
        <p>Dialog Content</p>
      </BaseModalDialog>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings Window')).toBeInTheDocument()
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
    expect(screen.getByText('Dialog Content')).toBeInTheDocument()
  })

  it('binds to store dialogStack when dialogId is provided', () => {
    const { rerender } = render(
      <BaseModalDialog dialogId="preset-settings" title="Preset Settings">
        <p>Preset Content</p>
      </BaseModalDialog>
    )

    // Initially closed because dialogStack is empty
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Open via store action
    act(() => {
      useAppStore.getState().openDialog('preset-settings')
    })
    rerender(
      <BaseModalDialog dialogId="preset-settings" title="Preset Settings">
        <p>Preset Content</p>
      </BaseModalDialog>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Preset Settings')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <BaseModalDialog isOpen={true} onClose={handleClose} title="Custom Dialog">
        <div>Body</div>
      </BaseModalDialog>
    )

    const closeBtn = screen.getByRole('button', { name: /close dialog/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls store closeDialog when close button clicked without explicit onClose', () => {
    useAppStore.getState().openDialog('preset-settings')
    render(
      <BaseModalDialog dialogId="preset-settings" title="Preset Settings">
        <div>Preset Body</div>
      </BaseModalDialog>
    )

    const closeBtn = screen.getByRole('button', { name: /close dialog/i })
    fireEvent.click(closeBtn)

    expect(useAppStore.getState().dialogStack).toEqual([])
    expect(useAppStore.getState().isPresetSettingsOpen).toBe(false)
  })

  it('dismisses dialog when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <BaseModalDialog isOpen={true} onClose={handleClose} title="Escape Test">
        <div>Body</div>
      </BaseModalDialog>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('allows dragging the dialog by its header handle', () => {
    render(
      <BaseModalDialog
        isOpen={true}
        title="Draggable Window"
        headerTestId="custom-header-testid"
      >
        <div>Body</div>
      </BaseModalDialog>
    )

    const header = screen.getByTestId('custom-header-testid')
    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveStyle({ position: 'fixed' })

    // Simulate drag gesture
    fireEvent.pointerDown(header, { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientX: 150, clientY: 180, pointerId: 1 })
    fireEvent.pointerUp(header, { pointerId: 1 })

    expect(dialog).toBeInTheDocument()
  })
})
