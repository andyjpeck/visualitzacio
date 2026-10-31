import React, { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/app-store'
import { BaseModalDialog } from '../dialogs/base-modal-dialog'
import {
  getAvailablePresets,
  hasChildLayers,
  type PresetCatalogItem,
} from './preset-catalog'

export interface PresetSelectorProps {
  presets?: PresetCatalogItem[]
  className?: string
}

/**
 * Dropdown selector in the upper toolbar allowing one-click loading of generative presets.
 * If the current scene has active child layers, loading a preset prompts with an overwrite
 * confirmation dialog to prevent accidental data loss.
 */
export function PresetSelector({
  presets: customPresets,
  className = '',
}: PresetSelectorProps): React.ReactElement {
  const availablePresets = useMemo(() => {
    return customPresets ?? getAvailablePresets()
  }, [customPresets])

  const loadPreset = useAppStore((state) => state.loadPreset)

  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [pendingPreset, setPendingPreset] = useState<PresetCatalogItem | null>(null)

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const presetId = e.target.value
      if (!presetId) {
        setSelectedPresetId('')
        return
      }

      const target = availablePresets.find((p) => p.id === presetId)
      if (!target) return

      // Read graph nodes imperatively from store to avoid re-rendering toolbar on node drags
      const currentNodes = useAppStore.getState().graphNodes

      // If the scene currently has child layers, guard with confirmation modal
      if (hasChildLayers(currentNodes)) {
        setSelectedPresetId(target.id)
        setPendingPreset(target)
      } else {
        const result = loadPreset(target.preset)
        if (result.success) {
          setSelectedPresetId('')
        }
      }
    },
    [availablePresets, loadPreset],
  )

  const handleCancelOverwrite = useCallback(() => {
    setSelectedPresetId('')
    setPendingPreset(null)
  }, [])

  const handleConfirmOverwrite = useCallback(() => {
    if (!pendingPreset) return
    const result = loadPreset(pendingPreset.preset)
    if (result.success) {
      setSelectedPresetId('')
      setPendingPreset(null)
    }
  }, [loadPreset, pendingPreset])

  return (
    <>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:border-white/20 transition-all ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
        <select
          data-testid="toolbar-preset-selector"
          value={selectedPresetId}
          onChange={handleSelectChange}
          aria-label="Preset Selector"
          className="bg-transparent text-slate-200 hover:text-white focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
        >
          <option value="" className="bg-slate-900 text-slate-400">
            Select Preset...
          </option>
          {availablePresets.map((preset) => (
            <option
              key={preset.id}
              value={preset.id}
              className="bg-slate-900 text-slate-200"
            >
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Overwrite Confirmation Modal Guard */}
      {pendingPreset && (
        <BaseModalDialog
          isOpen={Boolean(pendingPreset)}
          onClose={handleCancelOverwrite}
          title="Overwrite Active Scene?"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          maxWidthClass="max-w-md"
          className="border-amber-500/40 shadow-amber-500/20"
          headerTestId="overwrite-preset-modal-header"
        >
          <div className="flex flex-col gap-4 text-xs font-mono select-none">
            <p className="text-slate-300 leading-relaxed">
              Your active visual scene contains layers that will be replaced. Loading{' '}
              <span className="font-bold text-cyber-cyan">
                &quot;{pendingPreset.name}&quot;
              </span>{' '}
              will overwrite the current canvas configuration.
            </p>

            <div className="p-3 rounded-lg bg-black/40 border border-cyber-cyan/30 flex flex-col gap-1.5">
              <span className="text-[10px] text-cyber-cyan uppercase font-bold tracking-wider">
                Preset Preview: {pendingPreset.name}
              </span>
              {pendingPreset.description && (
                <p className="text-[11px] text-slate-400 leading-normal">
                  {pendingPreset.description}
                </p>
              )}
              {pendingPreset.author && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Author:{' '}
                  <span className="text-white font-medium">
                    {pendingPreset.author}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                data-testid="cancel-overwrite-preset-btn"
                onClick={handleCancelOverwrite}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                data-testid="confirm-overwrite-preset-btn"
                onClick={handleConfirmOverwrite}
                className="px-3 py-1.5 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/90 text-black font-semibold shadow-lg shadow-cyber-cyan/20 transition-all cursor-pointer"
              >
                Overwrite & Apply
              </button>
            </div>
          </div>
        </BaseModalDialog>
      )}
    </>
  )
}
