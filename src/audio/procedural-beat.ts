/**
 * Generates a rhythmic, looping 4/4 electronic drum beat AudioBuffer in memory.
 * Contains synthesized kick (sub-bass transient), snare (noise + body), and hi-hats (high frequencies).
 */
export function createProceduralBeatBuffer(
  audioContext: AudioContext,
  bpm = 120,
  bars = 2,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate || 44100
  const beatsPerBar = 4
  const totalBeats = bars * beatsPerBar
  const secondsPerBeat = 60 / bpm
  const totalSeconds = totalBeats * secondsPerBeat
  const totalSamples = Math.floor(sampleRate * totalSeconds)

  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)

  for (let beat = 0; beat < totalBeats; beat++) {
    const beatStartTime = beat * secondsPerBeat
    const isKick = beat % 2 === 0 // Beats 1 and 3
    const isSnare = beat % 2 === 1 // Beats 2 and 4

    // 1. Kick Drum (Sub-bass pitch drop chirp)
    if (isKick) {
      const kickDuration = 0.35
      const kickSamples = Math.floor(kickDuration * sampleRate)
      const startSample = Math.floor(beatStartTime * sampleRate)
      let phase = 0

      for (let i = 0; i < kickSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        // Pitch drop from 160 Hz to 45 Hz
        const freq = 45 + 115 * Math.exp(-t * 22)
        phase += (2 * Math.PI * freq) / sampleRate
        const envelope = Math.exp(-t * 8)
        const sample = Math.sin(phase) * envelope * 0.95

        left[startSample + i] += sample
        right[startSample + i] += sample
      }
    }

    // 2. Snare Drum (185 Hz body + white noise burst)
    if (isSnare) {
      const snareDuration = 0.28
      const snareSamples = Math.floor(snareDuration * sampleRate)
      const startSample = Math.floor(beatStartTime * sampleRate)
      let phase = 0

      for (let i = 0; i < snareSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        phase += (2 * Math.PI * 185) / sampleRate
        const tone = Math.sin(phase) * Math.exp(-t * 22) * 0.4
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.6
        const sample = (tone + noise) * 0.85

        left[startSample + i] += sample
        right[startSample + i] += sample
      }
    }

    // 3. Hi-Hats (every eighth note)
    for (let sub = 0; sub < 2; sub++) {
      const hatTime = beatStartTime + sub * (secondsPerBeat / 2)
      const hatDuration = 0.05
      const hatSamples = Math.floor(hatDuration * sampleRate)
      const startSample = Math.floor(hatTime * sampleRate)

      for (let i = 0; i < hatSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        // High-frequency noise burst
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 45) * 0.45

        // Slight stereo panning on off-beat hats
        const pan = sub === 1 ? 0.65 : 0.45
        left[startSample + i] += noise * (1 - pan)
        right[startSample + i] += noise * pan
      }
    }
  }

  // Soft limit clipping
  for (let i = 0; i < totalSamples; i++) {
    left[i] = Math.tanh(left[i])
    right[i] = Math.tanh(right[i])
  }

  return buffer
}
