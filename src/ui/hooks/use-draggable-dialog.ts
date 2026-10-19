import { useEffect, useRef, useState } from 'react'

export interface DraggableDialogOptions {
  defaultWidth?: number
  defaultHeight?: number
  initialX?: number
  initialY?: number
}

/**
 * Hook providing drag-and-drop repositioning with boundary clamping and window resize protection.
 */
export function useDraggableDialog(options: DraggableDialogOptions = {}) {
  const { defaultWidth = 576, defaultHeight = 600, initialX, initialY } = options

  const dialogRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const defaultX = typeof window !== 'undefined' ? Math.max(16, Math.floor((window.innerWidth - defaultWidth) / 2)) : 100
    const defaultY = typeof window !== 'undefined' ? Math.max(70, Math.floor((window.innerHeight - defaultHeight) / 2)) : 100
    return {
      x: initialX ?? defaultX,
      y: initialY ?? defaultY,
    }
  })

  // Keep position clamped within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      const dialogWidth = dialogRef.current?.offsetWidth || defaultWidth
      const dialogHeight = dialogRef.current?.offsetHeight || defaultHeight
      const maxX = Math.max(0, window.innerWidth - dialogWidth)
      const maxY = Math.max(0, window.innerHeight - dialogHeight)
      setPosition((prev) => ({
        x: Math.min(maxX, Math.max(0, prev.x)),
        y: Math.min(maxY, Math.max(0, prev.y)),
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [defaultWidth, defaultHeight])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return

    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    const deltaX = e.clientX - dragStartRef.current.mouseX
    const deltaY = e.clientY - dragStartRef.current.mouseY

    const dialogWidth = dialogRef.current?.offsetWidth || defaultWidth
    const dialogHeight = dialogRef.current?.offsetHeight || defaultHeight
    const maxX = Math.max(0, window.innerWidth - dialogWidth)
    const maxY = Math.max(0, window.innerHeight - dialogHeight)

    const newX = Math.min(maxX, Math.max(0, dragStartRef.current.startX + deltaX))
    const newY = Math.min(maxY, Math.max(0, dragStartRef.current.startY + deltaY))

    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      if (typeof e.currentTarget.releasePointerCapture === 'function') {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          // ignore
        }
      }
      dragStartRef.current = null
      setIsDragging(false)
    }
  }

  return {
    dialogRef,
    position,
    setPosition,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
