import React from 'react'
import { AlertCircle, X } from 'lucide-react'

export interface AudioErrorToastProps {
  error: string | null
  onDismiss: () => void
}

/**
 * Renders an accessible floating alert toast when an audio error or device permission issue occurs.
 */
export function AudioErrorToast({
  error,
  onDismiss,
}: AudioErrorToastProps): React.ReactElement | null {
  if (!error) return null

  return (
    <div
      role="alert"
      className="absolute top-20 right-4 z-50 flex items-center gap-3 p-3 max-w-sm rounded-xl backdrop-blur-md bg-cyber-void/95 border border-cyber-crimson/50 text-slate-200 shadow-2xl shadow-cyber-crimson/20 animate-in fade-in slide-in-from-top-2"
    >
      <AlertCircle className="w-5 h-5 text-cyber-crimson shrink-0" />
      <div className="flex-1 text-xs">
        <p className="font-bold text-cyber-crimson">Audio Device Notice</p>
        <p className="opacity-90">{error}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
