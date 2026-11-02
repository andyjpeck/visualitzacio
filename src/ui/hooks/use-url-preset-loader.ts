import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/app-store'
import type { AudioManager } from '../../audio/audio-manager'

/** Strict regex allowing only alphanumeric characters, dashes, and underscores (no slashes, dots, or protocols). */
export const PRESET_NAME_REGEX = /^[a-zA-Z0-9_-]+$/

/** Disallowed prototype pollution and reserved property identifiers. */
const RESERVED_NAMES = new Set(['__proto__', 'prototype', 'constructor'])

export interface UseUrlPresetLoaderOptions {
  audioManager?: AudioManager | null
  onSuccess?: (presetName: string) => void
  onError?: (errorMessage: string) => void
}

export interface UseUrlPresetLoaderResult {
  isLoading: boolean
  loadedPresetName: string | null
  error: string | null
}

/**
 * Extracts and sanitizes the `?preset=<name>` query parameter from the URL.
 * Returns null if the parameter is absent or fails security sanitization.
 */
export function extractSanitizedPresetName(search: string): string | null {
  const searchParams = new URLSearchParams(search)
  const rawPreset = searchParams.get('preset')
  if (!rawPreset) return null

  // Strip trailing .json extension if provided
  const cleanName = rawPreset.trim().replace(/\.json$/i, '')
  if (!PRESET_NAME_REGEX.test(cleanName) || RESERVED_NAMES.has(cleanName.toLowerCase())) {
    console.warn(`[Security] Rejected unsafe preset parameter: "${rawPreset}"`)
    return null
  }
  return cleanName
}

/**
 * Determines whether audio playback was requested via query parameter (?play=1 or ?autoplay=1).
 */
export function isAutoplayRequested(search: string): boolean {
  const searchParams = new URLSearchParams(search)
  const playVal = searchParams.get('play') ?? searchParams.get('autoplay')
  return playVal === '1' || playVal === 'true'
}

/**
 * Hook that inspects window.location.search on app startup, securely fetches the requested
 * same-origin preset from `${BASE_URL}presets/<name>.json`, applies it to the store, and optionally
 * triggers procedural sample audio playback.
 */
export function useUrlPresetLoader(
  options: UseUrlPresetLoaderOptions = {},
): UseUrlPresetLoaderResult {
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined' || !window.location) return false
    return Boolean(extractSanitizedPresetName(window.location.search))
  })
  const [loadedPresetName, setLoadedPresetName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  })

  const loadPreset = useAppStore((state) => state.loadPreset)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const setSourceType = useAppStore((state) => state.setSourceType)

  useEffect(() => {
    if (hasLoadedRef.current) return

    if (typeof window === 'undefined' || !window.location) return

    const presetName = extractSanitizedPresetName(window.location.search)
    if (!presetName) return

    const autoplay = isAutoplayRequested(window.location.search)

    const rawBase = import.meta.env.BASE_URL || '/'
    const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
    const presetUrl = `${baseUrl}presets/${presetName}.json`

    const abortController = new AbortController()
    let isCancelled = false

    fetch(presetUrl, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load preset "${presetName}" (HTTP ${res.status})`)
        }
        return res.json()
      })
      .then(async (presetJson) => {
        if (isCancelled) return
        const result = loadPreset(presetJson)
        if (!result.success) {
          const errMsg = result.errors?.join('; ') ?? 'Preset deserialization failed'
          setError(errMsg)
          if (optionsRef.current.onError) {
            optionsRef.current.onError(errMsg)
          } else {
            console.error(`[UrlPresetLoader] ${errMsg}`)
          }
          return
        }

        hasLoadedRef.current = true
        setLoadedPresetName(presetName)
        optionsRef.current.onSuccess?.(presetName)

        if (autoplay && optionsRef.current.audioManager) {
          try {
            setSourceType('sample')
            await optionsRef.current.audioManager.playSample()
            if (!isCancelled) setIsPlaying(true)
          } catch (audioErr) {
            // Autoplay policy may require user interaction first
            console.info('[UrlPresetLoader] Audio autoplay deferred pending user interaction', audioErr)
          }
        }
      })
      .catch((err) => {
        if (isCancelled || (err as Error).name === 'AbortError') return
        const errMsg = (err as Error).message
        setError(errMsg)
        if (optionsRef.current.onError) {
          optionsRef.current.onError(errMsg)
        } else {
          console.error(`[UrlPresetLoader] ${errMsg}`)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [loadPreset, setIsPlaying, setSourceType])

  return { isLoading, loadedPresetName, error }
}
