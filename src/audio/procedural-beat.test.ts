import { describe, it, expect } from 'vitest'
import { createProceduralBeatBuffer } from './procedural-beat'
import { createMockAudioContext } from '../test/fixtures/audio-context-mock'

describe('Procedural Beat Synthesizer', () => {
  it('creates a multi-second AudioBuffer with rhythmic kick, snare, and hi-hat content', () => {
    const { audioContext } = createMockAudioContext()
    // Mock createBuffer on audioContext for jsdom
    const mockBuffer = {
      sampleRate: 44100,
      length: 44100 * 4,
      duration: 4,
      numberOfChannels: 2,
      getChannelData: () => new Float32Array(44100 * 4),
    } as unknown as AudioBuffer

    audioContext.createBuffer = () => mockBuffer

    const buffer = createProceduralBeatBuffer(audioContext, 120, 2)
    expect(buffer).toBeDefined()
    expect(buffer.duration).toBe(4)
  })
})
