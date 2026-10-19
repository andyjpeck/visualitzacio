import React from 'react'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { QUICK_REF_VARS, QUICK_REF_FUNCS } from './expression-catalog'

export interface ExpressionQuickReferenceProps {
  isOpen: boolean
  onToggle: () => void
  onInsertToken: (token: string) => void
}

/**
 * Collapsible accordion panel displaying built-in system variables ($BASS, $MID, etc.)
 * and system functions (#BEAT, #FFT, etc.) with clickable token insertion chips.
 */
export function ExpressionQuickReference({
  isOpen,
  onToggle,
  onInsertToken,
}: ExpressionQuickReferenceProps): React.ReactElement {
  return (
    <div className="border border-white/10 rounded-lg bg-white/5 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2.5 text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
        aria-controls="formula-reference-panel"
        data-testid="toggle-formula-reference"
      >
        <div className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-cyber-cyan" />
          <span>Quick Reference</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[10px] text-slate-500 font-mono">
            {isOpen ? 'Hide' : 'Vars & Funcs'}
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          id="formula-reference-panel"
          className="p-3 pt-1 border-t border-white/5 text-[11px] font-mono space-y-2.5 text-slate-400"
          data-testid="formula-reference-panel"
        >
          <div>
            <div className="text-[10px] font-bold text-cyber-cyan uppercase tracking-wider mb-1.5">
              System Variables ($VARS) — Hover for details
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REF_VARS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  title={item.tooltip}
                  onClick={() => onInsertToken(item.insertText)}
                  className="px-2 py-0.5 rounded bg-black/40 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 hover:border-cyber-cyan cursor-help transition-all text-[11px] font-mono"
                  data-testid={`var-item-${item.name.replace('$', '')}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-cyber-magenta uppercase tracking-wider mb-1.5">
              System & Math Functions (#FUNCS) — Hover for details
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REF_FUNCS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  title={item.tooltip}
                  onClick={() => onInsertToken(item.insertText)}
                  className="px-2 py-0.5 rounded bg-black/40 border border-cyber-magenta/30 text-cyber-magenta hover:bg-cyber-magenta/20 hover:border-cyber-magenta cursor-help transition-all text-[11px] font-mono"
                  data-testid={`func-item-${item.name.replace(/[^a-zA-Z0-9]/g, '')}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
