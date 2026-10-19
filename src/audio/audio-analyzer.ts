import type { FrameContext } from '../contracts/frame-context'
import {
  DEFAULT_AUDIO_BANDS,
  type AudioBandsSettings,
} from '../contracts/preset-settings'

/**
 * Logarithmic frequency mapping: f = 20 * 10^(3x) for x in [0.0, 1.0].
 * At x = 0.0, f = 20 Hz.
 * At x = 1.0, f = 20000 Hz.
 */
export function logScaleToFrequency(x: number): number {
  const clampedX = Math.max(0, Math.min(1, x))
  return 20 * Math.pow(10, 3 * clampedX)
}

/**
 * Inverts frequency to logarithmic scale [0.0, 1.0].
 */
export function frequencyToLogScale(frequency: number): number {
  const clampedFreq = Math.max(20, Math.min(20000, frequency))
  return Math.log10(clampedFreq / 20) / 3
}

export interface AudioAnalyzerOptions {
  fftSize?: number
  beatCooldownMs?: number
  rmsAttack?: number
  rmsDecay?: number
  audioBands?: Partial<AudioBandsSettings>
}

/**
 * Real-time Digital Signal Processing (DSP) analyzer.
 * Extracts frequency energy bands ($BASS, $MID, $TREBLE), computes smoothed
 * Root-Mean-Square (RMS) amplitude with asymmetric attack/decay, and detects
 * percussive transients for instantaneous $BEAT and rolling $BPM calculation.
 */
export class AudioAnalyzer {
  private readonly fftSize: number
  private readonly beatCooldownMs: number
  private readonly rmsAttack: number
  private readonly rmsDecay: number
  private audioBands: AudioBandsSettings

  private smoothedRms = 0
  private lastBeatTimeMs = -1000
  private rollingBpm = 120.0
  private bassEnergyHistory: number[] = []
  private prevBass = 0

  private byteFrequencyData: Uint8Array
  private floatTimeData: Float32Array

  /**
   * Initializes the DSP AudioAnalyzer with configurable FFT resolution, beat cooldown, and attack/decay filters.
   *
   * @param options - Configuration options for FFT sizing and smoothing filters.
   */
  constructor(options: AudioAnalyzerOptions = {}) {
    this.fftSize = options.fftSize ?? 2048
    this.beatCooldownMs = options.beatCooldownMs ?? 120
    this.rmsAttack = options.rmsAttack ?? 0.8
    this.rmsDecay = options.rmsDecay ?? 0.15
    this.audioBands = {
      ...DEFAULT_AUDIO_BANDS,
      ...options.audioBands,
    }

    const binCount = this.fftSize / 2
    this.byteFrequencyData = new Uint8Array(binCount)
    this.floatTimeData = new Float32Array(binCount)
  }

  /**
   * Updates frequency band cutoff boundaries ($BASS, $MID, $TREBLE).
   *
   * @param bands - Partial or complete frequency band settings.
   */
  setAudioBands(bands: Partial<AudioBandsSettings>): void {
    this.audioBands = {
      ...this.audioBands,
      ...bands,
    }
  }

  /**
   * Returns currently active frequency band cutoff boundaries.
   */
  getAudioBands(): AudioBandsSettings {
    return { ...this.audioBands }
  }

  /**
   * Aggregates frequency bins into $BASS, $MID, and $TREBLE using configured band cutoffs
   * and computes binary $BEAT and rolling $BPM.
   */
  processFrequencyData(
    freqData: Uint8Array,
    sampleRate: number,
    frameContext: FrameContext,
    nowMs?: number,
  ): void {
    const binCount = freqData.length
    const binResolution = sampleRate / (binCount * 2) // sampleRate / fftSize

    let bassSum = 0
    let bassCount = 0
    let midSum = 0
    let midCount = 0
    let trebleSum = 0
    let trebleCount = 0

    for (let i = 0; i < binCount; i++) {
      const centerFreq = (i + 0.5) * binResolution
      const value = freqData[i] / 255.0

      if (
        centerFreq >= this.audioBands.bassMin &&
        centerFreq < this.audioBands.bassMax
      ) {
        bassSum += value
        bassCount++
      } else if (
        centerFreq >= this.audioBands.midMin &&
        centerFreq < this.audioBands.midMax
      ) {
        midSum += value
        midCount++
      } else if (
        centerFreq >= this.audioBands.trebleMin &&
        centerFreq <= this.audioBands.trebleMax
      ) {
        trebleSum += value
        trebleCount++
      }
    }

    const bass = bassCount > 0 ? bassSum / bassCount : 0
    const mid = midCount > 0 ? midSum / midCount : 0
    const treble = trebleCount > 0 ? trebleSum / trebleCount : 0

    frameContext.$BASS = bass
    frameContext.$MID = mid
    frameContext.$TREBLE = treble

    // Beat transient detection & rolling BPM
    const currentNowMs = nowMs ?? (typeof performance !== 'undefined' ? performance.now() : 0)
    this.updateBeatDetection(bass, frameContext, currentNowMs)
  }

  private updateBeatDetection(
    bass: number,
    frameContext: FrameContext,
    nowMs: number,
  ): void {
    let avgBass = 0
    if (this.bassEnergyHistory.length > 0) {
      for (let i = 0; i < this.bassEnergyHistory.length; i++) {
        avgBass += this.bassEnergyHistory[i]
      }
      avgBass /= this.bassEnergyHistory.length
    }

    const isRisingEdge = bass > this.prevBass + 0.1
    const isTransient =
      bass > 0.35 &&
      (this.bassEnergyHistory.length === 0 ||
        bass > avgBass * 1.2 ||
        isRisingEdge ||
        avgBass < 0.1)

    this.prevBass = bass
    this.bassEnergyHistory.push(bass)
    if (this.bassEnergyHistory.length > 30) {
      this.bassEnergyHistory.shift()
    }
    const cooldownElapsed = nowMs - this.lastBeatTimeMs >= this.beatCooldownMs

    if (isTransient && cooldownElapsed) {
      frameContext.$BEAT = 1.0
      frameContext.secondsSinceLastBeat = 0.0
      frameContext.framesSinceLastBeat = 0

      if (this.lastBeatTimeMs >= 0) {
        const ibi = nowMs - this.lastBeatTimeMs
        // Consider IBIs between 250ms (240 BPM) and 1500ms (40 BPM)
        if (ibi >= 250 && ibi <= 1500) {
          const instantBpm = 60000 / ibi
          this.rollingBpm = this.rollingBpm * 0.7 + instantBpm * 0.3
          frameContext.$BPM = Math.round(this.rollingBpm * 10) / 10
        }
      }
      this.lastBeatTimeMs = nowMs
    } else {
      frameContext.$BEAT = 0.0
    }
  }

  /**
   * Computes normalized RMS energy and smooths with attack and decay.
   */
  processTimeData(timeData: Float32Array, frameContext: FrameContext): void {
    let sumSquares = 0
    const length = timeData.length

    for (let i = 0; i < length; i++) {
      const sample = timeData[i]
      sumSquares += sample * sample
    }

    const rawRms = Math.min(1.0, Math.sqrt(sumSquares / length))

    // Asymmetric attack/decay smoothing
    if (rawRms > this.smoothedRms) {
      this.smoothedRms += this.rmsAttack * (rawRms - this.smoothedRms)
    } else {
      this.smoothedRms += this.rmsDecay * (rawRms - this.smoothedRms)
    }

    frameContext.$RMS = Math.max(0, Math.min(1.0, this.smoothedRms))
  }

  /**
   * Returns normalized waveform view in [-1.0, 1.0].
   */
  getWaveform(timeData: Float32Array): Float32Array {
    return timeData
  }

  /**
   * Full frame analysis pass reading from Web Audio AnalyserNode.
   */
  analyze(
    analyserNode: AnalyserNode,
    frameContext: FrameContext,
    sampleRate = 44100,
    nowMs?: number,
  ): void {
    // Populate pre-allocated buffers
    analyserNode.getByteFrequencyData(this.byteFrequencyData as unknown as Uint8Array<ArrayBuffer>)
    analyserNode.getFloatTimeDomainData(this.floatTimeData as unknown as Float32Array<ArrayBuffer>)

    this.processFrequencyData(this.byteFrequencyData, sampleRate, frameContext, nowMs)
    this.processTimeData(this.floatTimeData, frameContext)
    frameContext.frequencyData = this.byteFrequencyData
    frameContext.timeDomainData = this.floatTimeData
  }

  /**
   * Smoothly decays transient audio telemetry variables when audio playback is paused or inactive.
   *
   * @param frameContext - Target frame context containing real-time telemetry variables
   */
  decayIdle(frameContext: FrameContext): void {
    frameContext.$BASS *= 0.92
    frameContext.$MID *= 0.92
    frameContext.$TREBLE *= 0.92
    frameContext.$RMS *= 0.85
    frameContext.$BEAT = 0.0
  }

  /**
   * Resets internal DSP filter states, history buffers, and tempo tracking to baseline.
   */
  reset(): void {
    this.smoothedRms = 0
    this.lastBeatTimeMs = -1000
    this.rollingBpm = 120.0
    this.bassEnergyHistory.length = 0
    this.prevBass = 0
  }
}

