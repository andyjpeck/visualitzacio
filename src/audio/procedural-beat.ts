/**
 * Generates an expressive, looping electronic music composition in an AudioBuffer.
 * Features a rich multi-bar chord progression (Dm9 - Bbmaj9 - Gm9 - A7),
 * syncopated analog synth bassline, and dynamic breakbeat drums with ghost snares and fills.
 */

interface ChordVoice {
  readonly notes: readonly number[]
  readonly bass: number
}

// 8-bar emotive Cyberpunk / Synthwave chord progression in D minor
const CHORD_PROGRESSION: readonly ChordVoice[] = [
  { notes: [146.83, 174.61, 220.0, 261.63, 329.63], bass: 73.42 }, // Bar 1: Dm9 (D3, F3, A3, C4, E4)
  { notes: [116.54, 146.83, 174.61, 220.0, 261.63], bass: 58.27 }, // Bar 2: Bbmaj9 (Bb2, D3, F3, A3, C4)
  { notes: [98.0, 146.83, 174.61, 220.0, 293.66], bass: 49.0 }, // Bar 3: Gm9 (G2, D3, F3, A3, D4)
  { notes: [110.0, 164.81, 220.0, 277.18], bass: 55.0 }, // Bar 4: A7 (A2, E3, A3, C#4)
  { notes: [146.83, 220.0, 261.63, 329.63, 349.23], bass: 73.42 }, // Bar 5: Dm9 (higher voicing with F4)
  { notes: [130.81, 174.61, 220.0, 261.63, 329.63], bass: 87.31 }, // Bar 6: Fmaj7 (C3, F3, A3, C4, E4)
  { notes: [130.81, 164.81, 196.0, 233.08, 293.66], bass: 65.41 }, // Bar 7: C9 (C3, E3, G3, Bb3, D4)
  { notes: [116.54, 174.61, 220.0, 277.18], bass: 55.0 }, // Bar 8: Bbmaj7 -> A7alt turnaround
]

// Sparkling melodic arpeggio notes for the second half of the loop (Bars 5-8)
const ARP_NOTES = [587.33, 659.25, 698.46, 880.0, 1046.5] // D5, E5, F5, A5, C6

/**
 * Creates a procedural music AudioBuffer with chords, bassline, and dynamic drums.
 *
 * @param audioContext - Host AudioContext providing sample rate and buffer allocation.
 * @param bpm - Tempo in beats per minute (default 118).
 * @param bars - Total number of bars to generate before seamless loop (default 8).
 * @returns Fully populated stereo AudioBuffer ready for looping playback.
 */
export function createProceduralBeatBuffer(
  audioContext: AudioContext,
  bpm = 118,
  bars = 8,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate || 44100
  const beatsPerBar = 4
  const totalBeats = bars * beatsPerBar
  const secondsPerBeat = 60 / bpm
  const secondsPerBar = secondsPerBeat * beatsPerBar
  const totalSeconds = totalBeats * secondsPerBeat
  const totalSamples = Math.floor(sampleRate * totalSeconds)

  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  // 1. Chords & Analog Bassline Synthesis
  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * secondsPerBar
    const chordDef = CHORD_PROGRESSION[bar % CHORD_PROGRESSION.length]
    const chord = chordDef.notes
    const chordDuration = secondsPerBar * 0.94
    const chordSamples = Math.floor(chordDuration * sampleRate)
    const startIdx = Math.floor(barStart * sampleRate)

    // Polyphonic Chords with warm stereo spread
    for (let n = 0; n < chord.length; n++) {
      const freq = chord[n]
      const pan = 0.2 + 0.6 * (n / Math.max(1, chord.length - 1))
      const gain = 0.075 / Math.sqrt(chord.length)
      let phase = 0
      const phaseStep = (2 * Math.PI * freq) / sampleRate

      for (let s = 0; s < chordSamples && startIdx + s < totalSamples; s++) {
        const t = s / sampleRate
        phase += phaseStep
        // Warm saw-sine hybrid with subtle harmonic overtone
        const tone = (Math.sin(phase) + 0.35 * Math.sin(phase * 2)) * 0.7
        const attack = Math.min(1.0, t / 0.045)
        const release = Math.min(1.0, (chordDuration - t) / 0.08)
        const env = attack * release * (0.8 + 0.2 * Math.exp(-t * 0.7))
        const val = tone * env * gain

        left[startIdx + s] += val * (1 - pan)
        right[startIdx + s] += val * pan
      }
    }

    // Syncopated Bassline (driving root motion)
    const bassFreq = chordDef.bass
    const bassRhythm = [0, 0.75, 1.5, 2.25, 3.0, 3.75]
    for (const bBeat of bassRhythm) {
      const bassStart = barStart + bBeat * secondsPerBeat
      const bassDuration = 0.38 * secondsPerBeat
      const bSamples = Math.floor(bassDuration * sampleRate)
      const bIdx = Math.floor(bassStart * sampleRate)
      let bPhase = 0
      const bStep = (2 * Math.PI * bassFreq) / sampleRate

      for (let s = 0; s < bSamples && bIdx + s < totalSamples; s++) {
        const t = s / sampleRate
        bPhase += bStep
        const wave = (Math.sin(bPhase) + 0.35 * Math.sin(bPhase * 2)) * 0.8
        const env = Math.exp(-t * 5.5)
        const val = wave * env * 0.32
        left[bIdx + s] += val
        right[bIdx + s] += val
      }
    }

    // Melodic Arpeggio Accents (Bars 5 to 8)
    if (bar >= 4) {
      for (let step = 0; step < 8; step++) {
        const arpTime = barStart + step * (secondsPerBeat / 2)
        const arpNote = ARP_NOTES[(bar * 2 + step) % ARP_NOTES.length]
        const arpDuration = 0.22
        const arpSamples = Math.floor(arpDuration * sampleRate)
        const aIdx = Math.floor(arpTime * sampleRate)
        let aPhase = 0
        const aStep = (2 * Math.PI * arpNote) / sampleRate
        const aPan = (step % 2 === 0) ? 0.3 : 0.7

        for (let s = 0; s < arpSamples && aIdx + s < totalSamples; s++) {
          const t = s / sampleRate
          aPhase += aStep
          const bell = Math.sin(aPhase) * Math.exp(-t * 12.0) * 0.05
          left[aIdx + s] += bell * (1 - aPan)
          right[aIdx + s] += bell * aPan
        }
      }
    }
  }

  // 2. Dynamic Drums & Fills Synthesis
  for (let bar = 0; bar < bars; bar++) {
    const barStart = bar * secondsPerBar

    // Kick: Varied breakbeat patterns across bars
    const kickBeats =
      bar === 7
        ? [0, 1.0, 2.0, 2.5, 3.0, 3.5] // Turnaround build
        : bar % 2 === 0
          ? [0, 1.5, 2.5]
          : [0, 1.75, 2.5, 3.25] // Syncopated push

    for (const kBeat of kickBeats) {
      const kStart = barStart + kBeat * secondsPerBeat
      const kSamples = Math.floor(0.32 * sampleRate)
      const startSample = Math.floor(kStart * sampleRate)
      let phase = 0

      for (let i = 0; i < kSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        // Pitch drop from 165 Hz to 45 Hz sub-bass
        const freq = 45 + 120 * Math.exp(-t * 24)
        phase += (2 * Math.PI * freq) / sampleRate
        const env = Math.exp(-t * 8.5)
        const sample = Math.sin(phase) * env * 0.85

        left[startSample + i] += sample
        right[startSample + i] += sample
      }
    }

    // Snare: Crisp 2 & 4 backbeat with ghost notes and turnaround roll
    const isFillBar = bar === 3 || bar === 7
    const snareBeats = isFillBar ? [1.0, 3.0, 3.5, 3.75] : [1.0, 3.0]

    for (const sBeat of snareBeats) {
      const isGhost = sBeat > 3.0
      const sStart = barStart + sBeat * secondsPerBeat
      const sSamples = Math.floor(0.26 * sampleRate)
      const startSample = Math.floor(sStart * sampleRate)
      let phase = 0

      for (let i = 0; i < sSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        phase += (2 * Math.PI * 185) / sampleRate
        const tone = Math.sin(phase) * Math.exp(-t * 24) * 0.35
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14) * 0.55
        const mult = isGhost ? 0.35 : 0.8
        const sample = (tone + noise) * mult

        left[startSample + i] += sample * 0.95
        right[startSample + i] += sample * 1.05
      }
    }

    // Hi-Hats: 16th-note running groove with dynamic velocity and open sizzles
    for (let step = 0; step < 16; step++) {
      const hatTime = barStart + step * (secondsPerBeat / 4)
      const isOpen = step === 6 || step === 14 // Open upbeat hats
      const hatDur = isOpen ? 0.16 : 0.045
      const hSamples = Math.floor(hatDur * sampleRate)
      const startSample = Math.floor(hatTime * sampleRate)
      const decayRate = isOpen ? 18 : 55
      const vel = isOpen ? 0.42 : (step % 4 === 0 ? 0.35 : (step % 2 === 0 ? 0.25 : 0.16))
      const pan = 0.35 + 0.3 * (step % 2)

      for (let i = 0; i < hSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * decayRate) * vel
        left[startSample + i] += noise * (1 - pan)
        right[startSample + i] += noise * pan
      }
    }
  }

  // 3. Master Soft Limiter & Warmth Saturation
  for (let i = 0; i < totalSamples; i++) {
    left[i] = Math.tanh(left[i] * 0.85)
    right[i] = Math.tanh(right[i] * 0.85)
  }

  return buffer
}
