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

    // 1. Kick Drum
    if (isKick) {
      const kickDuration = 0.35
      const kickSamples = Math.floor(kickDuration * sampleRate)
      const startSample = Math.floor(beatStartTime * sampleRate)

      for (let i = 0; i < kickSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        // Pitch drop from 160 Hz to 40 Hz
        const freq = 40 + 120 * Math.exp(-t * 22)
        const envelope = Math.exp(-t * 9)
        const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.9

        left[startSample + i] += sample
        right[startSample + i] += sample
      }
    }

    // 2. Snare Drum
    if (isSnare) {
      const snareDuration = 0.25
      const snareSamples = Math.floor(snareDuration * sampleRate)
      const startSample = Math.floor(beatStartTime * sampleRate)

      for (let i = 0; i < snareSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18)
        const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 24)
        const sample = (noise * 0.6 + tone * 0.4) * 0.75

        left[startSample + i] += sample
        right[startSample + i] += sample
      }
    }

    // 3. Hi-Hats (every eighth note)
    for (let sub = 0; sub < 2; sub++) {
      const hatTime = beatStartTime + sub * (secondsPerBeat / 2)
      const hatDuration = 0.06
      const hatSamples = Math.floor(hatDuration * sampleRate)
      const startSample = Math.floor(hatTime * sampleRate)

      for (let i = 0; i < hatSamples && startSample + i < totalSamples; i++) {
        const t = i / sampleRate
        // High-frequency noise
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 45)
        const sample = noise * 0.35

        // Slight stereo panning on off-beat hats
        const pan = sub === 1 ? 0.8 : 0.5
        left[startSample + i] += sample * (1 - pan)
        right[startSample + i] += sample * pan
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
