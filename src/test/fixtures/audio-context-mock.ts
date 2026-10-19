import { vi } from 'vitest'

export function createMockAudioContext() {
  const dummyNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }

  const analyserNode = {
    ...dummyNode,
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.8,
    getByteFrequencyData: vi.fn((array: Uint8Array) => array.fill(0)),
    getFloatFrequencyData: vi.fn((array: Float32Array) => array.fill(-100)),
    getByteTimeDomainData: vi.fn((array: Uint8Array) => array.fill(128)),
    getFloatTimeDomainData: vi.fn((array: Float32Array) => array.fill(0)),
  }

  const mediaStreamSourceNode = {
    ...dummyNode,
  }

  const audioContext = {
    state: 'suspended' as AudioContextState,
    sampleRate: 44100,
    currentTime: 0,
    resume: vi.fn(async () => {
      audioContext.state = 'running'
    }),
    suspend: vi.fn(async () => {
      audioContext.state = 'suspended'
    }),
    close: vi.fn(async () => {
      audioContext.state = 'closed'
    }),
    createAnalyser: vi.fn(() => analyserNode),
    createChannelSplitter: vi.fn(() => ({
      ...dummyNode,
      numberOfOutputs: 2,
    })),
    createGain: vi.fn(() => ({
      ...dummyNode,
      gain: { value: 1.0 },
    })),
    createMediaElementSource: vi.fn(() => dummyNode),
    createMediaStreamSource: vi.fn(() => mediaStreamSourceNode),
    destination: dummyNode,
  }

  return {
    audioContext: audioContext as unknown as AudioContext,
    analyserNode,
    mediaStreamSourceNode,
  }
}
