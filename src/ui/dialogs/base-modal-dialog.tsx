import React from 'react'
import { createPortal } from 'react-dom'
import { GripHorizontal, X } from 'lucide-react'
import { useAppStore, type DialogId } from '../store/app-store'
import { useDraggableDialog, type DraggableDialogOptions } from '../hooks/use-draggable-dialog'
import { useEscapeKey } from '../hooks/use-escape-key'

export interface BaseModalDialogProps extends DraggableDialogOptions {
  /**
   * Dialog ID in centralized app store.
   * When provided, automatically binds open/close state to dialogStack unless overridden.
   */
  dialogId?: DialogId

  /**
   * Explicit open state override.
   * If omitted and dialogId is provided, defaults to checking whether dialogId is at the top of dialogStack.
   */
  isOpen?: boolean

  /**
   * Explicit close handler override.
   * If omitted and dialogId is provided, defaults to closing the dialog via closeDialog(dialogId).
   */
  onClose?: () => void

  /** Title text or node displayed in the header */
  title: React.ReactNode

  /** Optional HTML id for title element (links aria-labelledby) */
  titleId?: string

  /** Optional leading icon next to title */
  icon?: React.ReactNode

  /** Optional action elements rendered in header before close button */
  headerExtra?: React.ReactNode

  /** Optional test ID attribute for header drag handle */
  headerTestId?: string

  /** Accessible label for the close button */
  closeAriaLabel?: string

  /** Tooltip on header drag handle */
  dragTooltip?: string

  /** Max width Tailwind class (defaults to 'max-w-xl') */
  maxWidthClass?: string

  /** Max height Tailwind class (defaults to 'max-h-[85vh]') */
  maxHeightClass?: string

  /** Padding Tailwind class on dialog container (defaults to 'p-6') */
  paddingClass?: string

  /** Additional classes applied to root dialog container */
  className?: string

  /** Additional classes applied to header */
  headerClassName?: string

  /** Whether to render a dimmed, blurred backdrop overlay behind the dialog (defaults to true) */
  hasBackdrop?: boolean

  /** Dialog content body */
  children: React.ReactNode
}

/**
 * Reusable Base Modal Dialog component.
 *
 * Encapsulates:
 * - Viewport boundary clamping and pointer dragging via `useDraggableDialog`
 * - Centered initial coordinates and window resize protection
 * - Global Escape key dismissal via `useEscapeKey`
 * - Centralized dialog stack integration via `useAppStore` (`dialogStack`, `closeDialog`)
 * - Cyberpunk glassmorphic styling, accessible ARIA dialog roles, and draggable header handle
 */
export function BaseModalDialog({
  dialogId,
  isOpen: explicitIsOpen,
  onClose: explicitOnClose,
  title,
  titleId,
  icon,
  headerExtra,
  headerTestId,
  closeAriaLabel = 'Close dialog',
  dragTooltip = 'Drag to move dialog around screen',
  maxWidthClass = 'max-w-xl',
  maxHeightClass = 'max-h-[85vh]',
  paddingClass = 'p-6',
  className = '',
  headerClassName = '',
  hasBackdrop = true,
  defaultWidth,
  defaultHeight,
  initialX,
  initialY,
  children,
}: BaseModalDialogProps): React.ReactElement | null {
  const storeIsOpen = useAppStore((state) => {
    if (!dialogId) return false
    if (state.dialogStack.length > 0) {
      return state.dialogStack[state.dialogStack.length - 1] === dialogId
    }
    if (dialogId === 'preset-settings') return state.isPresetSettingsOpen
    return false
  })
  const storeCloseDialog = useAppStore((state) => state.closeDialog)

  const resolvedIsOpen = explicitIsOpen !== undefined ? explicitIsOpen : storeIsOpen
  const handleClose =
    explicitOnClose ??
    (() => {
      if (dialogId) {
        storeCloseDialog(dialogId)
      }
    })

  const {
    dialogRef,
    position,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableDialog({
    defaultWidth,
    defaultHeight,
    initialX,
    initialY,
  })

  // Dismiss on Escape key
  useEscapeKey(resolvedIsOpen, handleClose)

  if (!resolvedIsOpen) return null

  const resolvedTitleId = titleId ?? (dialogId ? `${dialogId}-title` : 'modal-dialog-title')

  const dialogElement = (
    <>
      {/* Semi-transparent Backdrop Overlay */}
      {hasBackdrop && (
        <div
          data-testid="modal-backdrop"
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Floating Modal Window */}
      <div
        ref={dialogRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-[9999] w-[92vw] ${maxWidthClass} ${maxHeightClass} flex flex-col ${paddingClass} rounded-xl border border-cyber-cyan/40 bg-cyber-panel/95 backdrop-blur-md text-slate-100 shadow-2xl shadow-cyber-cyan/20 animate-in fade-in ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
      >
        {/* Header (Draggable Handle) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title={dragTooltip}
          data-testid={headerTestId}
          className={`flex items-center justify-between pb-4 border-b border-white/10 shrink-0 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${headerClassName}`.trim()}
        >
          <div className="flex items-center gap-2 text-cyber-cyan pointer-events-none">
            <GripHorizontal className="w-5 h-5 text-slate-400" />
            {icon}
            <h2 id={resolvedTitleId} className="text-base font-bold tracking-wide">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            {headerExtra}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={closeAriaLabel}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dialog Body Content */}
        {children}
      </div>
    </>
  )

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(dialogElement, document.body)
  }

  return dialogElement
}
