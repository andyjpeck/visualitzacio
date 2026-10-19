import { describe, it, expect, beforeEach } from 'vitest'
import { AudioAnalyzer, frequencyToLogScale, logScaleToFrequency } from './audio-analyzer'
import { createDefaultFrameContext } from '../contracts/frame-context'

describe('AudioAnalyzer DSP Utilities', () => {
  let analyzer: AudioAnalyzer
  let frameContext = createDefaultFrameContext()

  beforeEach(() => {
    analyzer = new AudioAnalyzer()
    frameContext = createDefaultFrameContext()
  })

  describe('Logarithmic Frequency Mapping', () => {
    it('maps x in [0.0, 1.0] to frequency range 20 Hz to 20000 Hz using f = 20 * 10^(3x)', () => {
      expect(logScaleToFrequency(0.0)).toBeCloseTo(20, 1)
      expect(logScaleToFrequency(1.0)).toBeCloseTo(20000, 1)
      // At x = 1/3 (approx 0.3333), f = 20 * 10^1 = 200 Hz
      expect(logScaleToFrequency(1 / 3)).toBeCloseTo(200, 1)
      // At x = 2/3 (approx 0.6667), f = 20 * 10^2 = 2000 Hz
      expect(logScaleToFrequency(2 / 3)).toBeCloseTo(2000, 1)
    })

    it('inverts frequency to logarithmic scale [0.0, 1.0]', () => {
      expect(frequencyToLogScale(20)).toBeCloseTo(0.0, 3)
      expect(frequencyToLogScale(20000)).toBeCloseTo(1.0, 3)
      expect(frequencyToLogScale(200)).toBeCloseTo(1 / 3, 3)
      expect(frequencyToLogScale(2000)).toBeCloseTo(2 / 3, 3)
    })
  })

  describe('Frequency Band Aggregation ($BASS, $MID, $TREBLE)', () => {
    it('aggregates bass (20-250 Hz), mid (250-4000 Hz), and treble (4000-16000 Hz) into [0.0, 1.0]', () => {
      const sampleRate = 44100
      const fftSize = 2048
      const binCount = fftSize / 2 // 1024
      const freqData = new Uint8Array(binCount)

      // Bin resolution = 44100 / 2048 = ~21.53 Hz per bin
      // Bass bins: 20 Hz to 250 Hz -> bin index ~1 to ~11
      for (let i = 1; i <= 11; i++) {
        freqData[i] = 255 // full energy in bass
      }

      analyzer.processFrequencyData(freqData, sampleRate, frameContext)

      expect(frameContext.$BASS).toBeGreaterThan(0.9)
      expect(frameContext.$MID).toBe(0.0)
      expect(frameContext.$TREBLE).toBe(0.0)
    })

    it('supports customizing frequency band cutoff boundaries', () => {
      // Configure Bass to 20-500 Hz instead of 20-250 Hz
      analyzer.setAudioBands({ bassMax: 500, midMin: 500 })
      expect(analyzer.getAudioBands().bassMax).toBe(500)
      expect(analyzer.getAudioBands().midMin).toBe(500)

      const sampleRate = 44100
      const binCount = 1024
      const freqData = new Uint8Array(binCount)
      // Bin 15 is around 323 Hz (44100 / 2048 * 15.5) -> previously $MID, now $BASS
      freqData[15] = 255

      analyzer.processFrequencyData(freqData, sampleRate, frameContext)
      expect(frameContext.$BASS).toBeGreaterThan(0.0)
      expect(frameContext.$MID).toBe(0.0)
    })

    it('populates mid frequency band when mid range bins are energized', () => {
      const sampleRate = 44100
      const binCount = 1024
      const freqData = new Uint8Array(binCount)

      // Mid bins: 250 Hz to 4000 Hz -> bin index ~12 to ~185
      for (let i = 12; i <= 185; i++) {
        freqData[i] = 128 // ~50% energy
      }

      analyzer.processFrequencyData(freqData, sampleRate, frameContext)

      expect(frameContext.$BASS).toBe(0.0)
      expect(frameContext.$MID).toBeCloseTo(128 / 255, 1)
      expect(frameContext.$TREBLE).toBe(0.0)
    })

    it('populates treble frequency band when treble range bins are energized', () => {
      const sampleRate = 44100
      const binCount = 1024
      const freqData = new Uint8Array(binCount)

      // Treble bins: 4000 Hz to 16000 Hz -> bin index ~186 to ~743
      for (let i = 186; i <= 743; i++) {
        freqData[i] = 255
      }

      analyzer.processFrequencyData(freqData, sampleRate, frameContext)

      expect(frameContext.$BASS).toBe(0.0)
      expect(frameContext.$MID).toBe(0.0)
      expect(frameContext.$TREBLE).toBeGreaterThan(0.9)
    })
  })

  describe('Time-domain Waveform & RMS Energy', () => {
    it('computes RMS energy and smooths with attack and decay', () => {
      const timeData = new Float32Array(1024)
      // Pure sine wave with amplitude 1.0: RMS is 1 / sqrt(2) ≈ 0.707
      for (let i = 0; i < timeData.length; i++) {
        timeData[i] = Math.sin((i / timeData.length) * Math.PI * 2)
      }

      // First tick (attack)
      analyzer.processTimeData(timeData, frameContext)
      expect(frameContext.$RMS).toBeGreaterThan(0.4)
      expect(frameContext.$RMS).toBeLessThanOrEqual(1.0)

      const initialRms = frameContext.$RMS

      // Silence (decay)
      timeData.fill(0)
      analyzer.processTimeData(timeData, frameContext)
      expect(frameContext.$RMS).toBeLessThan(initialRms)
    })

    it('extracts normalized waveform in [-1.0, 1.0]', () => {
      const timeData = new Float32Array(512)
      timeData[0] = -1.0
      timeData[1] = 0.5
      timeData[2] = 1.0

      const waveform = analyzer.getWaveform(timeData)
      expect(waveform[0]).toBe(-1.0)
      expect(waveform[1]).toBe(0.5)
      expect(waveform[2]).toBe(1.0)
    })
  })

  describe('Binary $BEAT Transient Detection & Rolling $BPM', () => {
    it('triggers $BEAT = 1.0 on strong onset and 0.0 on subsequent frames within cooldown', () => {
      const sampleRate = 44100
      const binCount = 1024
      const freqData = new Uint8Array(binCount)

      // Silence baseline
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 0)
      expect(frameContext.$BEAT).toBe(0.0)

      // Kick drum transient at t = 100ms
      for (let i = 1; i <= 15; i++) freqData[i] = 250
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 100)
      expect(frameContext.$BEAT).toBe(1.0)

      // Next frame at t = 150ms (< 120ms cooldown from 100ms) with strong bass should NOT trigger $BEAT again
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 150)
      expect(frameContext.$BEAT).toBe(0.0)

      // Frame at t = 250ms (> 120ms cooldown) with strong bass can trigger again
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 250)
      expect(frameContext.$BEAT).toBe(1.0)
    })

    it('updates rolling $BPM from inter-beat intervals and retains default 120.0 initially', () => {
      expect(frameContext.$BPM).toBe(120.0)

      const sampleRate = 44100
      const binCount = 1024
      const freqData = new Uint8Array(binCount)
      for (let i = 1; i <= 15; i++) freqData[i] = 255

      // Beat 1 at t = 0
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 0)
      expect(frameContext.$BEAT).toBe(1.0)
      expect(frameContext.$BPM).toBe(120.0)

      // Decay between beats at t = 250ms
      freqData.fill(0)
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 250)
      expect(frameContext.$BEAT).toBe(0.0)

      // Beat 2 at t = 500ms (500ms IBI = 120 BPM)
      for (let i = 1; i <= 15; i++) freqData[i] = 255
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 500)
      expect(frameContext.$BEAT).toBe(1.0)
      expect(frameContext.$BPM).toBeCloseTo(120.0, 0)

      // Decay between beats at t = 700ms
      freqData.fill(0)
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 700)
      expect(frameContext.$BEAT).toBe(0.0)

      // Beat 3 at t = 928ms (428ms IBI = 140 BPM)
      for (let i = 1; i <= 15; i++) freqData[i] = 255
      analyzer.processFrequencyData(freqData, sampleRate, frameContext, 928)
      expect(frameContext.$BEAT).toBe(1.0)
      // Rolling average moves towards 140
      expect(frameContext.$BPM).toBeGreaterThan(120.0)
    })
  })

  describe('decayIdle', () => {
    it('smoothly decays audio telemetry when paused or idle', () => {
      frameContext.$BASS = 1.0
      frameContext.$MID = 0.8
      frameContext.$TREBLE = 0.6
      frameContext.$RMS = 0.5
      frameContext.$BEAT = 1.0

      analyzer.decayIdle(frameContext)

      expect(frameContext.$BASS).toBeCloseTo(0.92, 2)
      expect(frameContext.$MID).toBeCloseTo(0.736, 2)
      expect(frameContext.$TREBLE).toBeCloseTo(0.552, 2)
      expect(frameContext.$RMS).toBeCloseTo(0.425, 2)
      expect(frameContext.$BEAT).toBe(0.0)
    })
  })
})

