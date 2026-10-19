import { createProceduralBeatBuffer } from './procedural-beat'

export type AudioSourceType = 'sample' | 'mic' | 'none'

export interface AudioManagerOptions {
  createAudioContext?: () => AudioContext
}

export class AudioManager {
  private audioContext: AudioContext
  private masterGain: GainNode
  private analyserNode: AnalyserNode
  private sampleBuffer: AudioBuffer | null = null
  private currentSourceNode: AudioBufferSourceNode | null = null
  private micStream: MediaStream | null = null
  private micSourceNode: MediaStreamAudioSourceNode | null = null

  private sourceType: AudioSourceType = 'none'
  private playing = false
  private volume = 1.0
  private lastError: string | null = null

  constructor(options: AudioManagerOptions = {}) {
    const factory =
      options.createAudioContext ??
      (() => {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        return new AudioCtx()
      })

    this.audioContext = factory()
    this.masterGain = this.audioContext.createGain()
    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    // Audio routing for output
    this.masterGain.connect(this.analyserNode)
    this.analyserNode.connect(this.audioContext.destination)
  }

  /**
   * Unlocks AudioContext on user gesture.
   */
  async resume(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * Starts playback of the procedural / bundled rhythmic test sample.
   */
  async playSample(): Promise<void> {
    await this.resume()

    if (this.sourceType === 'mic') {
      this.disableMicrophone()
    }

    if (this.playing) {
      return
    }

    if (!this.sampleBuffer) {
      this.sampleBuffer = createProceduralBeatBuffer(this.audioContext, 120, 2)
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = this.sampleBuffer
    source.loop = true
    source.connect(this.masterGain)

    source.start(0)
    this.currentSourceNode = source
    this.playing = true
    this.sourceType = 'sample'
    this.lastError = null
  }

  /**
   * Pauses the sample player.
   */
  pauseSample(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop()
      } catch {
        // Node may already be stopped
      }
      this.currentSourceNode.disconnect()
      this.currentSourceNode = null
    }
    this.playing = false
    if (this.sourceType === 'sample') {
      this.sourceType = 'none'
    }
  }

  /**
   * Enables microphone capture with uncompressed musical capture settings.
   */
  async enableMicrophone(): Promise<boolean> {
    await this.resume()

    if (this.playing) {
      this.pauseSample()
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported on this platform/browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      this.micStream = stream
      this.micSourceNode = this.audioContext.createMediaStreamSource(stream)

      // Connect microphone to analyserNode only — DO NOT connect to destination to avoid acoustic feedback!
      this.micSourceNode.connect(this.analyserNode)

      this.sourceType = 'mic'
      this.playing = true
      this.lastError = null
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.lastError = `Microphone error: ${message}`
      this.sourceType = 'none'
      this.playing = false
      return false
    }
  }

  /**
   * Disables microphone capture and releases audio stream tracks.
   */
  disableMicrophone(): void {
    if (this.micSourceNode) {
      this.micSourceNode.disconnect()
      this.micSourceNode = null
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }
    if (this.sourceType === 'mic') {
      this.sourceType = 'none'
      this.playing = false
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain?.gain) {
      this.masterGain.gain.value = this.volume
    }
  }

  getVolume(): number {
    return this.volume
  }

  isPlaying(): boolean {
    return this.playing
  }

  getSourceType(): AudioSourceType {
    return this.sourceType
  }

  getLastError(): string | null {
    return this.lastError
  }

  getAnalyserNode(): AnalyserNode {
    return this.analyserNode
  }

  getSampleRate(): number {
    return this.audioContext.sampleRate || 44100
  }

  dispose(): void {
    this.pauseSample()
    this.disableMicrophone()

    if (this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
    }
  }
}
