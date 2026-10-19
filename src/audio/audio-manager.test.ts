import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioManager } from './audio-manager'
import { createMockAudioContext } from '../test/fixtures/audio-context-mock'

describe('AudioManager', () => {
  let mockContextObj: ReturnType<typeof createMockAudioContext>
  let manager: AudioManager

  beforeEach(() => {
    mockContextObj = createMockAudioContext()
    manager = new AudioManager({
      createAudioContext: () => mockContextObj.audioContext,
    })
  })

  afterEach(() => {
    manager.dispose()
  })

  it('initializes in suspended state and resumes on user gesture', async () => {
    expect(mockContextObj.audioContext.state).toBe('suspended')
    await manager.resume()
    expect(mockContextObj.audioContext.resume).toHaveBeenCalled()
    expect(mockContextObj.audioContext.state).toBe('running')
  })

  it('plays and pauses bundled procedural sample', async () => {
    // Mock createBufferSource
    const mockSourceNode = {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
    mockContextObj.audioContext.createBufferSource = vi.fn(() => mockSourceNode as unknown as AudioBufferSourceNode)
    mockContextObj.audioContext.createBuffer = vi.fn(() => ({
      sampleRate: 44100,
      length: 44100 * 4,
      duration: 4,
      numberOfChannels: 2,
      getChannelData: () => new Float32Array(44100 * 4),
    }) as unknown as AudioBuffer)

    await manager.playSample()
    expect(manager.isPlaying()).toBe(true)
    expect(mockSourceNode.start).toHaveBeenCalled()

    manager.pauseSample()
    expect(manager.isPlaying()).toBe(false)
    expect(mockSourceNode.stop).toHaveBeenCalled()
  })

  it('switches to microphone with uncompressed musical capture settings', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
    }

    const getUserMediaMock = vi.fn().mockResolvedValue(mockStream)
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: getUserMediaMock,
      },
    })

    const success = await manager.enableMicrophone()
    expect(success).toBe(true)
    expect(getUserMediaMock).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    expect(manager.getSourceType()).toBe('mic')

    vi.unstubAllGlobals()
  })

  it('gracefully handles microphone permission denial', async () => {
    const getUserMediaMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: getUserMediaMock,
      },
    })

    const success = await manager.enableMicrophone()
    expect(success).toBe(false)
    expect(manager.getSourceType()).not.toBe('mic')
    expect(manager.getLastError()).toContain('Permission denied')

    vi.unstubAllGlobals()
  })

  it('adjusts output gain volume', () => {
    manager.setVolume(0.5)
    expect(manager.getVolume()).toBe(0.5)
  })

  it('provides active AnalyserNode for audio telemetry', () => {
    const analyser = manager.getAnalyserNode()
    expect(analyser).toBeDefined()
    expect(analyser.fftSize).toBe(2048)
  })
})
