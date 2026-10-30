import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  extractSanitizedPresetName,
  isAutoplayRequested,
  useUrlPresetLoader,
} from './use-url-preset-loader'
import { useAppStore } from '../store/app-store'
import type { AudioManager } from '../../audio/audio-manager'

describe('useUrlPresetLoader & Security Sanitization', () => {
  describe('extractSanitizedPresetName', () => {
    it('extracts valid alphanumeric preset names', () => {
      expect(extractSanitizedPresetName('?preset=quadrant-mirrored-spectrum')).toBe(
        'quadrant-mirrored-spectrum',
      )
      expect(extractSanitizedPresetName('?preset=Preset_123')).toBe('Preset_123')
    })

    it('strips .json suffix automatically', () => {
      expect(extractSanitizedPresetName('?preset=mirrored-t-spectrum.json')).toBe(
        'mirrored-t-spectrum',
      )
      expect(extractSanitizedPresetName('?preset=demo.JSON')).toBe('demo')
    })

    it('rejects path traversal attempts', () => {
      expect(extractSanitizedPresetName('?preset=../secret')).toBeNull()
      expect(extractSanitizedPresetName('?preset=..%2Fsecret')).toBeNull()
      expect(extractSanitizedPresetName('?preset=../../etc/passwd')).toBeNull()
    })

    it('rejects forward slashes and backslashes', () => {
      expect(extractSanitizedPresetName('?preset=sub/preset')).toBeNull()
      expect(extractSanitizedPresetName('?preset=sub\\preset')).toBeNull()
    })

    it('rejects arbitrary external URLs and protocol schemes', () => {
      expect(extractSanitizedPresetName('?preset=https://evil.com/payload')).toBeNull()
      expect(extractSanitizedPresetName('?preset=http://localhost:8080/evil')).toBeNull()
      expect(extractSanitizedPresetName('?preset=javascript:alert(1)')).toBeNull()
      expect(extractSanitizedPresetName('?preset=data:text/json;base64,...')).toBeNull()
    })

    it('rejects XSS and shell injection characters', () => {
      expect(extractSanitizedPresetName('?preset=<script>')).toBeNull()
      expect(extractSanitizedPresetName('?preset=foo;rm%20-rf')).toBeNull()
      expect(extractSanitizedPresetName('?preset=foo%20%26%20bar')).toBeNull()
    })

    it('returns null when preset parameter is absent or empty', () => {
      expect(extractSanitizedPresetName('')).toBeNull()
      expect(extractSanitizedPresetName('?foo=bar')).toBeNull()
      expect(extractSanitizedPresetName('?preset=')).toBeNull()
    })
  })

  describe('isAutoplayRequested', () => {
    it('recognizes play=1 and play=true', () => {
      expect(isAutoplayRequested('?play=1')).toBe(true)
      expect(isAutoplayRequested('?preset=demo&play=1')).toBe(true)
      expect(isAutoplayRequested('?play=true')).toBe(true)
    })

    it('recognizes autoplay=1 and autoplay=true', () => {
      expect(isAutoplayRequested('?autoplay=1')).toBe(true)
      expect(isAutoplayRequested('?autoplay=true')).toBe(true)
    })

    it('returns false when play flag is absent or 0', () => {
      expect(isAutoplayRequested('')).toBe(false)
      expect(isAutoplayRequested('?play=0')).toBe(false)
      expect(isAutoplayRequested('?play=false')).toBe(false)
    })
  })

  describe('useUrlPresetLoader hook execution', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    afterEach(() => {
      window.history.pushState({}, '', '/')
    })

    it('fetches and loads preset when valid ?preset is in URL', async () => {
      window.history.pushState({}, '', '/visualitzacio/?preset=quadrant-mirrored-spectrum')

      const mockPresetData = {
        schemaVersion: 2,
        metadata: { name: 'Quadrant Test', version: 2, created: '2026-10-30T00:00:00Z' },
        settings: { targetFps: 60, resolutionScale: 1, audioBands: { bassMin: 20, bassMax: 250, midMin: 250, midMax: 4000, trebleMin: 4000, trebleMax: 16000 } },
        root: {
          id: 'master-frame-buffer',
          type: 'masterFrameBuffer',
          params: {},
          children: [],
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPresetData,
      })

      const loadPresetSpy = vi.spyOn(useAppStore.getState(), 'loadPreset')
      const onSuccess = vi.fn()

      const { result } = renderHook(() => useUrlPresetLoader({ onSuccess }))

      await waitFor(() => {
        expect(result.current.loadedPresetName).toBe('quadrant-mirrored-spectrum')
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/presets/quadrant-mirrored-spectrum.json'),
      )
      expect(loadPresetSpy).toHaveBeenCalledWith(mockPresetData)
      expect(onSuccess).toHaveBeenCalledWith('quadrant-mirrored-spectrum')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('triggers sample audio playback when ?play=1 is present', async () => {
      window.history.pushState({}, '', '/visualitzacio/?preset=quadrant-mirrored-spectrum&play=1')

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          schemaVersion: 2,
          metadata: { name: 'Autoplay Test', version: 2, created: '2026-10-30T00:00:00Z' },
          settings: { targetFps: 60, resolutionScale: 1, audioBands: { bassMin: 20, bassMax: 250, midMin: 250, midMax: 4000, trebleMin: 4000, trebleMax: 16000 } },
          root: { id: 'master-frame-buffer', type: 'masterFrameBuffer', params: {}, children: [] },
        }),
      })

      const mockAudioManager = {
        playSample: vi.fn().mockResolvedValue(undefined),
      } as unknown as AudioManager

      const { result } = renderHook(() =>
        useUrlPresetLoader({ audioManager: mockAudioManager }),
      )

      await waitFor(() => {
        expect(result.current.loadedPresetName).toBe('quadrant-mirrored-spectrum')
      })

      expect(mockAudioManager.playSample).toHaveBeenCalled()
      expect(useAppStore.getState().isPlaying).toBe(true)
      expect(useAppStore.getState().sourceType).toBe('sample')
    })

    it('sets error and calls onError if fetch fails', async () => {
      window.history.pushState({}, '', '/visualitzacio/?preset=nonexistent')

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const onError = vi.fn()
      const { result } = renderHook(() => useUrlPresetLoader({ onError }))

      await waitFor(() => {
        expect(result.current.error).toContain('HTTP 404')
      })

      expect(onError).toHaveBeenCalledWith(expect.stringContaining('HTTP 404'))
      expect(result.current.isLoading).toBe(false)
      expect(result.current.loadedPresetName).toBeNull()
    })
  })
})
