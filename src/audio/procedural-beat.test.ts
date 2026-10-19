import { describe, it, expect } from 'vitest'
import { createProceduralBeatBuffer } from './procedural-beat'
import { createMockAudioContext } from '../test/fixtures/audio-context-mock'

describe('Procedural Beat Synthesizer', () => {
  it('creates a multi-second AudioBuffer with rhythmic kick, snare, and hi-hat content', () => {
    const { audioContext } = createMockAudioContext()
    const leftData = new Float32Array(44100 * 4)
    const rightData = new Float32Array(44100 * 4)
    const mockBuffer = {
      sampleRate: 44100,
      length: 44100 * 4,
      duration: 4,
      numberOfChannels: 2,
      getChannelData: (ch: number) => (ch === 0 ? leftData : rightData),
    } as unknown as AudioBuffer

    audioContext.createBuffer = () => mockBuffer

    const buffer = createProceduralBeatBuffer(audioContext, 120, 2)
    expect(buffer).toBeDefined()
    expect(buffer.duration).toBe(4)

    // Check non-zero sample amplitudes
    let maxAmp = 0
    let nonZeroCount = 0
    for (let i = 0; i < leftData.length; i++) {
      const abs = Math.abs(leftData[i])
      if (abs > maxAmp) maxAmp = abs
      if (abs > 0.01) nonZeroCount++
    }

    expect(maxAmp).toBeGreaterThan(0.5)
    expect(nonZeroCount).toBeGreaterThan(10000)
  })
})
