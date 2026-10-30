import { DuperscopeNode, type DuperscopeDrawMode } from './duperscope-node'
import type { DuperscopeAudioMode, DuperscopeChannel } from './duperscope-runner'

export interface DuperscopeTemplate {
  id: string
  name: string
  description: string
  drawMode: DuperscopeDrawMode
  audioMode: DuperscopeAudioMode
  channel: DuperscopeChannel
  opacity: number | string
  initCode: string
  beatCode: string
  frameCode: string
  pointCode: string
  instantiate: (id: string, name?: string) => DuperscopeNode
}

export const DEFAULT_DUPERSCOPE_CONFIG = {
  drawMode: 'lines' as DuperscopeDrawMode,
  audioMode: 'waveform' as DuperscopeAudioMode,
  channel: 'center' as DuperscopeChannel,
  opacity: 1.0,
  initCode: 'n = 200;',
  beatCode: '',
  frameCode: '',
  pointCode: '',
}

export const DUPERSCOPE_TEMPLATES: DuperscopeTemplate[] = [
  {
    id: 'oscilloscope-tunnel',
    name: 'Oscilloscope Tunnel',
    description: 'Circular reactive oscilloscope waveform tunnel',
    drawMode: 'lineLoop',
    audioMode: 'waveform',
    channel: 'center',
    opacity: 1.0,
    initCode: 'n = 360;\nangle = 0;',
    beatCode: 'angle = angle + 0.1;',
    frameCode: 'angle = angle + 0.015;\nr = 0.1 + $TREBLE * 0.9;\ng = 0.7;\nb = 1.0;',
    pointCode:
      'theta = i * 2 * PI;\nradius = 0.5 + (v * 0.25) + ($BASS * 0.15);\nx = cos(theta + angle) * radius;\ny = sin(theta + angle) * radius;',
    instantiate(id: string, name?: string) {
      return new DuperscopeNode({
        id,
        name: name ?? this.name,
        drawMode: this.drawMode,
        audioMode: this.audioMode,
        channel: this.channel,
        opacity: this.opacity,
        initCode: this.initCode,
        beatCode: this.beatCode,
        frameCode: this.frameCode,
        pointCode: this.pointCode,
      })
    },
  },
  {
    id: 'frequency-spectrum-ribbon',
    name: 'Frequency Spectrum Ribbon',
    description: 'Full-width logarithmic frequency spectrum ribbon with beat reactivity',
    drawMode: 'lines',
    audioMode: 'spectrum',
    channel: 'center',
    opacity: 1.0,
    initCode: 'n = 256;\nlinesize = 3.0;',
    beatCode: 'linesize = 6.0;',
    frameCode:
      'linesize = linesize + (3.0 - linesize) * 0.15;\nr = 1.0;\ng = 0.2 + $MID * 0.8;\nb = 0.1;',
    pointCode:
      'x = ((i * 2.0) - 1.0) * $ASPECT;\ny = -0.5 + (v * 1.2);',
    instantiate(id: string, name?: string) {
      return new DuperscopeNode({
        id,
        name: name ?? this.name,
        drawMode: this.drawMode,
        audioMode: this.audioMode,
        channel: this.channel,
        opacity: this.opacity,
        initCode: this.initCode,
        beatCode: this.beatCode,
        frameCode: this.frameCode,
        pointCode: this.pointCode,
      })
    },
  },
  {
    id: 'reactive-lissajous',
    name: 'Reactive Lissajous',
    description: 'Audio-reactive harmonic Lissajous parametric curves',
    drawMode: 'lines',
    audioMode: 'waveform',
    channel: 'center',
    opacity: 1.0,
    initCode: 'n = 500;\nt = 0;\nlinesize = 2.0;',
    beatCode: 't = t + 0.2;',
    frameCode:
      't = t + 0.02 + ($BASS * 0.02);\nr = sin(t) * 0.5 + 0.5;\ng = cos(t) * 0.5 + 0.5;\nb = 0.8;',
    pointCode:
      'w = i * 2 * PI;\nx = sin(w * 3 + t) * (0.7 + v * 0.2);\ny = cos(w * 2 + t * 1.5) * (0.7 + v * 0.2);',
    instantiate(id: string, name?: string) {
      return new DuperscopeNode({
        id,
        name: name ?? this.name,
        drawMode: this.drawMode,
        audioMode: this.audioMode,
        channel: this.channel,
        opacity: this.opacity,
        initCode: this.initCode,
        beatCode: this.beatCode,
        frameCode: this.frameCode,
        pointCode: this.pointCode,
      })
    },
  },
  {
    id: 'beat-particle',
    name: 'Beat Particle',
    description: 'Single audio-reactive pulsing beat orb particle',
    drawMode: 'points',
    audioMode: 'waveform',
    channel: 'center',
    opacity: 1.0,
    initCode: 'n = 1;\nlinesize = 12.0;',
    beatCode: 'linesize = 30.0;',
    frameCode:
      'linesize = linesize + (8.0 - linesize) * 0.1;\nr = 1.0;\ng = $BASS;\nb = 0.2;',
    pointCode:
      'x = $BASS * 0.4 * cos($TIME * 3);\ny = $BASS * 0.4 * sin($TIME * 3);',
    instantiate(id: string, name?: string) {
      return new DuperscopeNode({
        id,
        name: name ?? this.name,
        drawMode: this.drawMode,
        audioMode: this.audioMode,
        channel: this.channel,
        opacity: this.opacity,
        initCode: this.initCode,
        beatCode: this.beatCode,
        frameCode: this.frameCode,
        pointCode: this.pointCode,
      })
    },
  },
]

/**
 * Retrieves a Duperscope template by ID or undefined if not found.
 */
export function getDuperscopeTemplateById(id: string): DuperscopeTemplate | undefined {
  return DUPERSCOPE_TEMPLATES.find((t) => t.id === id)
}
