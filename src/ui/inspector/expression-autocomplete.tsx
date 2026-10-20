import React, { useCallback, useEffect, useState } from 'react'
import {
  QUICK_REF_FUNCS,
  QUICK_REF_VARS,
  type QuickRefItem,
} from '../expressions/expression-catalog'

export interface ExpressionAutocompleteProps {
  value: string
  onChange: (newValue: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Inline autocomplete dropdown for mathematical formulas,
 * triggering automatically when typing `$` (variables) or `#` (functions).
 */
export function ExpressionAutocomplete({
  value,
  onChange,
  inputRef,
  isOpen: forceOpen,
  onClose,
}: ExpressionAutocompleteProps): React.ReactElement | null {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeItems, setActiveItems] = useState<QuickRefItem[]>([])
  const [triggerInfo, setTriggerInfo] = useState<{
    trigger: '$' | '#'
    query: string
    startIndex: number
    endIndex: number
  } | null>(null)

  // Detect $ or # under cursor
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

    if (!match) {
      setActiveItems([])
      setTriggerInfo(null)
      return
    }

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
  }, [value, inputRef])

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
        setTimeout(() => {
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % activeItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(
          (prev) => (prev - 1 + activeItems.length) % activeItems.length,
        )
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (activeItems[selectedIndex]) {
          e.preventDefault()
          handleSelect(activeItems[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
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
        {triggerInfo?.trigger === '$' ? 'System Variables ($)' : 'System Functions (#)'}
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
