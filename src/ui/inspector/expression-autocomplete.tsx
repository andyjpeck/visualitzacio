import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DUPERSCOPE_LOCAL_VARS,
  QUICK_REF_FUNCS,
  QUICK_REF_VARS,
  type QuickRefItem,
} from '../expressions/expression-catalog'

export interface ExpressionAutocompleteProps {
  value: string
  onChange: (newValue: string) => void
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  isOpen?: boolean
  onClose?: () => void
  includeDuperscopeVars?: boolean
}

interface TriggerInfo {
  trigger: '$' | '#' | 'local'
  query: string
  startIndex: number
  endIndex: number
}

/**
 * Inline autocomplete dropdown for mathematical formulas and Duperscope scripts,
 * triggering automatically when typing `$` (variables), `#` (functions), or local variable tokens.
 */
export function ExpressionAutocomplete({
  value,
  onChange,
  inputRef,
  isOpen: forceOpen,
  onClose,
  includeDuperscopeVars = false,
}: ExpressionAutocompleteProps): React.ReactElement | null {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeItems, setActiveItems] = useState<QuickRefItem[]>([])
  const [triggerInfo, setTriggerInfo] = useState<TriggerInfo | null>(null)
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [])

  // Detect $, #, or local variable under cursor
  useEffect(() => {
    const input = inputRef.current
    if (!input) {
      setActiveItems([])
      setTriggerInfo(null)
      return
    }

    const cursorPos = input.selectionStart ?? value.length
    const textBeforeCursor = value.slice(0, cursorPos)

    // Match $ or # followed by word characters up to cursor
    const match = textBeforeCursor.match(/([$#])([a-zA-Z0-9_]*)$/)

    if (match) {
      const trigger = match[1] as '$' | '#'
      const query = match[2].toUpperCase()
      const startIndex = match.index ?? 0
      const endIndex = cursorPos

      const pool = trigger === '$' ? QUICK_REF_VARS : QUICK_REF_FUNCS
      const filtered = pool.filter((item) =>
        item.name.toUpperCase().includes(query),
      )

      setActiveItems(filtered)
      setSelectedIndex(0)
      setTriggerInfo({ trigger, query, startIndex, endIndex })
    } else if (includeDuperscopeVars) {
      const localMatch = textBeforeCursor.match(/(?:^|[^a-zA-Z0-9_$#])([a-zA-Z_][a-zA-Z0-9_]*)$/)
      if (localMatch && localMatch[1]) {
        const trigger = 'local' as const
        const query = localMatch[1].toLowerCase()
        const startIndex = cursorPos - localMatch[1].length
        const endIndex = cursorPos

        const filtered = DUPERSCOPE_LOCAL_VARS.filter((item) =>
          item.name.toLowerCase().startsWith(query) || item.name.toLowerCase().includes(query),
        )

        setActiveItems(filtered)
        setSelectedIndex(0)
        setTriggerInfo({ trigger, query, startIndex, endIndex })
      } else {
        setActiveItems([])
        setTriggerInfo(null)
      }
    } else {
      setActiveItems([])
      setTriggerInfo(null)
    }
  }, [value, inputRef, includeDuperscopeVars])

  const isOpen = (forceOpen ?? true) && activeItems.length > 0 && triggerInfo !== null

  const handleSelect = useCallback(
    (item: QuickRefItem) => {
      if (!triggerInfo) return
      const input = inputRef.current

      const before = value.slice(0, triggerInfo.startIndex)
      const after = value.slice(triggerInfo.endIndex)
      const insertion = item.insertText
      const nextValue = `${before}${insertion}${after}`

      onChange(nextValue)
      setActiveItems([])
      setTriggerInfo(null)
      if (onClose) onClose()

      // Restore cursor position after inserted token
      if (input) {
        const nextPos = before.length + insertion.length
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current)
        }
        focusTimeoutRef.current = setTimeout(() => {
          input.focus()
          input.setSelectionRange(nextPos, nextPos)
        }, 0)
      }
    },
    [triggerInfo, inputRef, value, onChange, onClose],
  )

  // Keyboard navigation on input
  useEffect(() => {
    const input = inputRef.current
    if (!input || !isOpen) return

    const handleKeyDown = (e: Event) => {
      const ke = e as KeyboardEvent
      if (ke.key === 'ArrowDown') {
        ke.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % activeItems.length)
      } else if (ke.key === 'ArrowUp') {
        ke.preventDefault()
        setSelectedIndex(
          (prev) => (prev - 1 + activeItems.length) % activeItems.length,
        )
      } else if (ke.key === 'Enter' || ke.key === 'Tab') {
        if (activeItems[selectedIndex]) {
          ke.preventDefault()
          handleSelect(activeItems[selectedIndex])
        }
      } else if (ke.key === 'Escape') {
        ke.preventDefault()
        setActiveItems([])
        setTriggerInfo(null)
        if (onClose) onClose()
      }
    }

    input.addEventListener('keydown', handleKeyDown)
    return () => {
      input.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, activeItems, selectedIndex, handleSelect, inputRef, onClose])

  if (!isOpen) return null

  return (
    <div
      data-testid="expression-autocomplete-dropdown"
      className="absolute left-0 top-full mt-1.5 w-full max-h-48 overflow-y-auto rounded-xl bg-cyber-dark/95 border border-cyber-cyan/30 shadow-2xl backdrop-blur-xl p-1 z-50 flex flex-col gap-0.5 text-xs font-mono select-none"
    >
      <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-white/5">
        {triggerInfo?.trigger === '$'
          ? 'System Variables ($)'
          : triggerInfo?.trigger === '#'
            ? 'System Functions (#)'
            : 'Duperscope Variables'}
      </div>
      {activeItems.map((item, idx) => (
        <button
          key={item.name}
          type="button"
          data-testid={`autocomplete-item-${item.name}`}
          onClick={() => handleSelect(item)}
          className={`flex flex-col text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            idx === selectedIndex
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
              : 'hover:bg-white/5 text-slate-300 border border-transparent'
          }`}
        >
          <div className="font-bold flex items-center justify-between">
            <span>{item.name}</span>
            <span className="text-[10px] text-slate-500 font-normal">
              Press Enter ↵
            </span>
          </div>
          <span className="text-[10px] text-slate-400 line-clamp-1">
            {item.tooltip}
          </span>
        </button>
      ))}
    </div>
  )
}
