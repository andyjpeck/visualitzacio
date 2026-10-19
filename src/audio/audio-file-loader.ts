/**
 * Decoded audio file result containing the native Web Audio AudioBuffer and filename.
 */
export interface LoadedAudioFile {
  buffer: AudioBuffer
  fileName: string
}

/**
 * Loads an audio file from the user's filesystem and decodes it via the provided AudioContext.
 * Reports granular loading and decoding stage progress via optional callback.
 *
 * @param ctx - Active AudioContext used to decode the raw binary audio data
 * @param file - File object selected by the user
 * @param onProgress - Optional callback receiving progress percentage (0-100) and stage description
 * @returns Decoded AudioBuffer and filename
 */
export async function loadAndDecodeAudioFile(
  ctx: AudioContext,
  file: File,
  onProgress?: (percent: number, stage: string) => void,
): Promise<LoadedAudioFile> {
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
  onProgress?.(10, `Reading file (${sizeMb} MB)...`)

  let arrayBuffer: ArrayBuffer
  if (typeof file.arrayBuffer === 'function') {
    arrayBuffer = await file.arrayBuffer()
    onProgress?.(50, 'Decoding audio buffer...')
  } else {
    arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const p = Math.round(10 + (e.loaded / e.total) * 40)
          onProgress?.(p, `Reading file (${(e.loaded / (1024 * 1024)).toFixed(1)} / ${sizeMb} MB)...`)
        }
      }
      reader.onload = () => {
        onProgress?.(50, 'Decoding audio buffer...')
        resolve(reader.result as ArrayBuffer)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  onProgress?.(70, 'Decoding audio buffer...')
  const decoded = await ctx.decodeAudioData(arrayBuffer)
  onProgress?.(95, 'Finalizing audio buffer...')

  onProgress?.(100, 'Audio ready!')
  return {
    buffer: decoded,
    fileName: file.name,
  }
}
