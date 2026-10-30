import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AudioTelemetryOverlay } from './audio-telemetry-overlay'
import { createDefaultFrameContext } from '../../contracts/frame-context'
import type { RenderEngine } from '../../engine/render-engine'
import { useAppStore } from '../store/app-store'

describe('AudioTelemetryOverlay Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      showDebugData: true,
      showFpsOverlay: true,
    })
  })

  it('renders audio telemetry meters for BASS, MID, TREBLE, RMS, and BEAT', () => {
    const frameContext = createDefaultFrameContext()
    frameContext.$BASS = 0.75
    frameContext.$MID = 0.5
    frameContext.$TREBLE = 0.25
    frameContext.$RMS = 0.6
    frameContext.$BEAT = 1.0
    frameContext.$BPM = 128.0
    frameContext.$TIME = 42.5
    frameContext.$FRAME = 2550

    const mockEngine = {
      getFrameContext: () => frameContext,
    } as unknown as RenderEngine

    render(<AudioTelemetryOverlay engine={mockEngine} />)

    expect(screen.getByText('BASS')).toBeInTheDocument()
    expect(screen.getByText('MID')).toBeInTheDocument()
    expect(screen.getByText('TREB')).toBeInTheDocument()
    expect(screen.getByText('RMS')).toBeInTheDocument()
    expect(screen.getByText('BEAT')).toBeInTheDocument()
    expect(screen.getByTestId('telemetry-bpm')).toHaveTextContent('128.0 BPM')
    expect(screen.getByTestId('telemetry-time')).toHaveTextContent('42.5s')
    expect(screen.getByTestId('telemetry-frame')).toHaveTextContent('2550')
  })

  it('renders nothing when showDebugData is false', () => {
    useAppStore.setState({ showDebugData: false, showFpsOverlay: false })
    const mockEngine = {
      getFrameContext: () => createDefaultFrameContext(),
    } as unknown as RenderEngine

    const { container } = render(<AudioTelemetryOverlay engine={mockEngine} />)
    expect(container.firstChild).toBeNull()
  })
})
