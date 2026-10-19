import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export interface ExpressionInputProps {
  id?: string
  label?: string
  value: string
  onChange: (val: string) => void
  isValid: boolean
  error?: string
  placeholder?: string
}

/**
 * Reusable mathematical expression text input with live syntax validation status badge.
 */
export function ExpressionInput({
  id = 'formula-input',
  label = 'Formula Expression',
  value,
  onChange,
  isValid,
  error,
  placeholder = 'e.g. 1.0 + $BASS * 0.8 + #BEAT(0.2) * 0.5',
}: ExpressionInputProps): React.ReactElement {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {isValid ? (
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Syntax Valid
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-mono text-cyber-crimson">
            <XCircle className="w-3.5 h-3.5" />
            Syntax Error
          </span>
        )}
      </div>

      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 rounded-lg bg-black/60 border font-mono text-sm text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
            isValid
              ? 'border-white/15 focus:border-cyber-cyan focus:ring-cyber-cyan'
              : 'border-cyber-crimson/60 focus:border-cyber-crimson focus:ring-cyber-crimson'
          }`}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {!isValid && error && (
        <p className="mt-1.5 text-xs font-mono text-cyber-crimson leading-tight">
          {error}
        </p>
      )}
    </div>
  )
}
