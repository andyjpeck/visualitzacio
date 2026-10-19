import { createProceduralBeatBuffer } from './procedural-beat'

export type AudioSourceType = 'sample' | 'mic' | 'file' | 'none'

export interface AudioManagerOptions {
  createAudioContext?: () => AudioContext
}

export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private micGain: GainNode | null = null
  private analyserNode: AnalyserNode | null = null
  private sampleBuffer: AudioBuffer | null = null
  private customBuffer: AudioBuffer | null = null
  private customFileName: string | null = null
  private currentSourceNode: AudioBufferSourceNode | null = null
  private micStream: MediaStream | null = null
  private micSourceNode: MediaStreamAudioSourceNode | null = null
  private muteGainNode: GainNode | null = null

  private readonly factory: () => AudioContext
  private sourceType: AudioSourceType = 'none'
  private playing = false
  private volume = 1.0
  private lastError: string | null = null
  private playbackStartTime = 0
  private playbackStartOffset = 0
  private pausedOffset = 0

  constructor(options: AudioManagerOptions = {}) {
    this.factory =
      options.createAudioContext ??
      (() => {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        return new AudioCtx()
      })

    // Initialize graph
    this.ensureActiveGraph()
  }

  /**
   * Ensures an active, unclosed AudioContext and connected nodes exist.
   */
  private ensureActiveGraph(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const ctx = this.factory()
      this.audioContext = ctx

      // Master output volume for sample playback
      this.masterGain = ctx.createGain()
      this.masterGain.gain.value = this.volume

      // Microphone preamp boost (3.5x) so natural voice/room sound clearly drives FFT
      this.micGain = ctx.createGain()
      this.micGain.gain.value = 3.5

      this.analyserNode = ctx.createAnalyser()
      this.analyserNode.fftSize = 2048
      this.analyserNode.smoothingTimeConstant = 0.8
      this.analyserNode.minDecibels = -90
      this.analyserNode.maxDecibels = -10

      // Audio routing:
      // 1. Sample goes to speakers (masterGain -> destination)
      this.masterGain.connect(ctx.destination)
      // 2. Sample also goes to analyser (masterGain -> analyserNode)
      this.masterGain.connect(this.analyserNode)

      // 3. Mic preamp connects to analyser
      this.micGain.connect(this.analyserNode)

      // 4. Analyser connects to a 0.0 volume mute sink to keep Chromium audio pump active without speaker feedback
      this.muteGainNode = ctx.createGain()
      this.muteGainNode.gain.value = 0.0
      this.analyserNode.connect(this.muteGainNode)
      this.muteGainNode.connect(ctx.destination)

      this.sampleBuffer = null
    }

    return this.audioContext
  }

  /**
   * Unlocks AudioContext on user gesture.
   */
  async resume(): Promise<void> {
    const ctx = this.ensureActiveGraph()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }

  /**
   * Starts playback of the procedural / bundled rhythmic test sample.
   */
  async playSample(): Promise<void> {
    const ctx = this.ensureActiveGraph()
    await this.resume()

    if (this.sourceType === 'mic') {
      this.disableMicrophone()
    }

    if (this.playing && this.currentSourceNode) {
      return
    }

    if (!this.sampleBuffer) {
      this.sampleBuffer = createProceduralBeatBuffer(ctx, 120, 2)
    }

    const source = ctx.createBufferSource()
    source.buffer = this.sampleBuffer
    source.loop = true
    source.connect(this.masterGain!)

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
   * Loads an audio file from the user's filesystem and decodes it into memory.
   */
  async loadAudioFile(file: File): Promise<string> {
    const ctx = this.ensureActiveGraph()
    await this.resume()

    const arrayBuffer =
      typeof file.arrayBuffer === 'function'
        ? await file.arrayBuffer()
        : await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as ArrayBuffer)
            reader.onerror = () => reject(reader.error)
            reader.readAsArrayBuffer(file)
          })

    const decoded = await ctx.decodeAudioData(arrayBuffer)
    this.customBuffer = decoded
    this.customFileName = file.name
    this.pausedOffset = 0
    this.playbackStartTime = 0
    this.playbackStartOffset = 0
    return file.name
  }

  hasCustomFile(): boolean {
    return this.customBuffer !== null
  }

  getCustomFileName(): string | null {
    return this.customFileName
  }

  /**
   * Returns current playback time in seconds for the loaded custom file.
   */
  getCurrentTime(): number {
    if (!this.customBuffer) return 0
    const duration = this.customBuffer.duration
    if (duration <= 0) return 0

    if (this.playing && this.sourceType === 'file' && this.audioContext) {
      const elapsed = Math.max(0, this.audioContext.currentTime - this.playbackStartTime)
      return (this.playbackStartOffset + elapsed) % duration
    }
    return this.pausedOffset % duration
  }

  /**
   * Returns total duration in seconds of the loaded custom file.
   */
  getDuration(): number {
    return this.customBuffer ? this.customBuffer.duration : 0
  }

  /**
   * Seeks to a specific timestamp in seconds within the loaded custom file.
   */
  seek(seconds: number): void {
    if (!this.customBuffer) return
    const duration = this.customBuffer.duration
    if (duration <= 0) return

    const clamped = Math.max(0, Math.min(seconds, duration))
    this.pausedOffset = clamped

    if (this.playing && this.sourceType === 'file' && this.currentSourceNode && this.audioContext) {
      try {
        this.currentSourceNode.stop()
      } catch {
        // Already stopped
      }
      this.currentSourceNode.disconnect()
      this.currentSourceNode = null

      const source = this.audioContext.createBufferSource()
      source.buffer = this.customBuffer
      source.loop = true
      source.connect(this.masterGain!)
      source.start(0, clamped % duration)

      this.currentSourceNode = source
      this.playbackStartTime = this.audioContext.currentTime
      this.playbackStartOffset = clamped
    }
  }

  /**
   * Plays the user-loaded audio file through the master output.
   */
  async playCustomFile(): Promise<void> {
    const ctx = this.ensureActiveGraph()
    await this.resume()

    if (this.sourceType === 'mic') {
      this.disableMicrophone()
    }
    if (this.sourceType === 'sample') {
      this.pauseSample()
    }

    if (this.playing && this.currentSourceNode) {
      return
    }

    if (!this.customBuffer) {
      throw new Error('No custom audio file loaded')
    }

    const duration = this.customBuffer.duration
    const offset = duration > 0 ? this.pausedOffset % duration : 0

    const source = ctx.createBufferSource()
    source.buffer = this.customBuffer
    source.loop = true
    source.connect(this.masterGain!)

    source.start(0, offset)
    this.currentSourceNode = source
    this.playbackStartTime = ctx.currentTime
    this.playbackStartOffset = offset
    this.playing = true
    this.sourceType = 'file'
    this.lastError = null
  }

  /**
   * Pauses the user-loaded audio file.
   */
  pauseCustomFile(): void {
    if (this.currentSourceNode) {
      this.pausedOffset = this.getCurrentTime()
      try {
        this.currentSourceNode.stop()
      } catch {
        // Node may already be stopped
      }
      this.currentSourceNode.disconnect()
      this.currentSourceNode = null
    }
    this.playing = false
    if (this.sourceType === 'file') {
      this.sourceType = 'none'
    }
  }

  /**
   * Enables microphone capture with uncompressed musical capture settings.
   */
  async enableMicrophone(): Promise<boolean> {
    const ctx = this.ensureActiveGraph()
    await this.resume()

    if (this.playing) {
      this.pauseSample()
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported on this platform/browser')
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      } catch {
        // Fallback to standard audio options if platform rejects strict unconstrained constraints
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      this.micStream = stream
      this.micSourceNode = ctx.createMediaStreamSource(stream)

      // Connect mic to preamp gain (which feeds analyserNode)
      if (this.micGain) {
        this.micSourceNode.connect(this.micGain)
      } else if (this.analyserNode) {
        this.micSourceNode.connect(this.analyserNode)
      }

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
      try {
        this.micSourceNode.disconnect()
      } catch {
        // Already disconnected
      }
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
    this.ensureActiveGraph()
    return this.analyserNode!
  }

  getSampleRate(): number {
    this.ensureActiveGraph()
    return this.audioContext?.sampleRate || 44100
  }

  dispose(): void {
    this.pauseSample()
    this.disableMicrophone()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
    }
    this.audioContext = null
    this.masterGain = null
    this.micGain = null
    this.analyserNode = null
    this.muteGainNode = null
  }
}
