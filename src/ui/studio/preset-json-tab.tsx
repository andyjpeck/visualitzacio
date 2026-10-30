import React, { useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useAppStore } from '../store/app-store'

export interface PresetJsonTabProps {
  className?: string
}

/**
 * Interactive Preset JSON tab displaying live serialized composition JSON.
 * Provides controls to Upload (.json file import), Download (.json file export),
 * Copy to clipboard, and edit/apply custom JSON directly to the scene graph.
 */
export function PresetJsonTab({ className = '' }: PresetJsonTabProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportPresetJson = useAppStore((state) => state.exportPresetJson)
  const loadPreset = useAppStore((state) => state.loadPreset)
  const graphNodes = useAppStore((state) => state.graphNodes)
  const graphEdges = useAppStore((state) => state.graphEdges)
  const targetFps = useAppStore((state) => state.targetFps)
  const resolutionScale = useAppStore((state) => state.resolutionScale)
  const audioBands = useAppStore((state) => state.audioBands)

  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userEditedJson, setUserEditedJson] = useState<string | null>(null)
  const isDirty = userEditedJson !== null

  // Generate live JSON from active state; state subscriptions ensure re-computation
  const liveJson = React.useMemo(() => {
    void graphNodes
    void graphEdges
    void targetFps
    void resolutionScale
    void audioBands
    return exportPresetJson('Visualització Composition', 2)
  }, [exportPresetJson, graphNodes, graphEdges, targetFps, resolutionScale, audioBands])

  const displayJson = userEditedJson ?? liveJson

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayJson).catch(() => {})
    }
    setCopied(true)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([displayJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preset-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        const result = loadPreset(text)
        if (result.success) {
          setUserEditedJson(null)
        } else {
          setError(result.errors?.join('; ') ?? 'Failed to import preset JSON.')
        }
      }
    }
    reader.onerror = () => {
      setError('Failed to read file from disk.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleApplyChanges = () => {
    setError(null)
    const result = loadPreset(displayJson)
    if (result.success) {
      setUserEditedJson(null)
    } else {
      setError(result.errors?.join('; ') ?? 'Invalid preset JSON payload.')
    }
  }

  const handleRevert = () => {
    setError(null)
    setUserEditedJson(null)
  }

  return (
    <div
      data-testid="preset-json-tab"
      className={`w-full h-full flex flex-col bg-[#05060b] font-mono text-xs select-text overflow-hidden ${className}`}
    >
      {/* Sub-Header Actions Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#090a12] border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>MODIFIED (UNSAVED)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-cyber-cyan text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-cyber-cyan" />
              <span>LIVE PRESET SYNCHRONIZED</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Upload, Download, Copy, Apply/Revert */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {isDirty && (
            <>
              <button
                type="button"
                data-testid="json-apply-btn"
                onClick={handleApplyChanges}
                title="Apply edited JSON to visualizer scene graph"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Apply</span>
              </button>
              <button
                type="button"
                data-testid="json-revert-btn"
                onClick={handleRevert}
                title="Discard changes and revert to live state"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>
              <span className="text-white/20">|</span>
            </>
          )}

          {/* Upload Button */}
          <button
            type="button"
            data-testid="json-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload preset (.json file)"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-cyber-cyan hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            data-testid="json-file-input"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Download Button */}
          <button
            type="button"
            data-testid="json-download-btn"
            onClick={handleDownload}
            title="Download preset (.json file)"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-cyber-cyan hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Download</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            data-testid="json-copy-btn"
            onClick={handleCopy}
            title="Copy preset JSON to clipboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-cyber-cyan hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Error Alert Banner */}
      {error && (
        <div
          data-testid="json-error-banner"
          className="px-3 py-1.5 bg-red-950/80 border-b border-red-500/50 text-red-200 text-[11px] flex items-center justify-between"
        >
          <span>Error: {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-white ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* JSON Editor / Code Viewer Area */}
      <div className="flex-1 w-full relative overflow-hidden">
        <textarea
          data-testid="json-editor-textarea"
          value={displayJson}
          onChange={(e) => {
            setUserEditedJson(e.target.value)
          }}
          spellCheck={false}
          aria-label="Preset JSON editor"
          className="w-full h-full p-3 bg-transparent text-cyan-200/90 font-mono text-xs leading-relaxed resize-none outline-none overflow-auto border-none selection:bg-cyber-cyan/30 selection:text-white"
        />
      </div>
    </div>
  )
}
