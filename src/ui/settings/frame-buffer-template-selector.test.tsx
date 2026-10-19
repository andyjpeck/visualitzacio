import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FrameBufferTemplateSelector } from './frame-buffer-template-selector'
import { useAppStore } from '../store/app-store'
import { FRAME_BUFFER_TEMPLATES } from '../../engine/frame-buffer/frame-buffer-templates'

describe('FrameBufferTemplateSelector Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      isTemplateSelectorOpen: true,
      selectedTemplateId: 'clean-slate',
      isCustomFeedbackConfig: false,
    })
  })

  it('renders all 6 templates when open', () => {
    render(<FrameBufferTemplateSelector />)

    expect(screen.getByText('Frame Buffer Templates')).toBeInTheDocument()

    for (const template of FRAME_BUFFER_TEMPLATES) {
      expect(screen.getByText(template.name)).toBeInTheDocument()
      expect(screen.getByText(template.description)).toBeInTheDocument()
    }
  })

  it('does not render when isTemplateSelectorOpen is false', () => {
    useAppStore.setState({ isTemplateSelectorOpen: false })
    const { container } = render(<FrameBufferTemplateSelector />)
    expect(container.firstChild).toBeNull()
  })

  it('selects and applies a template directly when not dirty', () => {
    render(<FrameBufferTemplateSelector />)

    const vortexCard = screen.getByText('Infinite Feedback Vortex').closest('button')
    expect(vortexCard).toBeDefined()
    fireEvent.click(vortexCard!)

    const state = useAppStore.getState()
    expect(state.selectedTemplateId).toBe('feedback-vortex')
    expect(state.feedbackEnabled).toBe(true)
    expect(state.feedbackBlendMode).toBe('replace')
    expect(state.feedbackScale).toBe(0.98)
  })

  it('prompts confirmation when selecting a template while dirty state is active', () => {
    useAppStore.setState({
      selectedTemplateId: 'clean-slate',
      isCustomFeedbackConfig: true,
    })

    render(<FrameBufferTemplateSelector />)

    const phosphorCard = screen.getByText('Analog Phosphor Trails').closest('button')
    fireEvent.click(phosphorCard!)

    // Should display confirmation dialog
    expect(screen.getByText(/Overwrite Custom Settings\?/i)).toBeInTheDocument()

    // Cancel preserves existing state
    const cancelButton = screen.getByRole('button', { name: /Keep Custom/i })
    fireEvent.click(cancelButton)

    expect(useAppStore.getState().selectedTemplateId).toBe('clean-slate')

    // Click again and confirm
    fireEvent.click(phosphorCard!)
    const applyButton = screen.getByRole('button', { name: /Overwrite/i })
    fireEvent.click(applyButton)

    expect(useAppStore.getState().selectedTemplateId).toBe('phosphor-trails')
    expect(useAppStore.getState().isCustomFeedbackConfig).toBe(false)
  })

  it('closes modal when close button is clicked', () => {
    render(<FrameBufferTemplateSelector />)

    const closeBtn = screen.getByRole('button', { name: /close template selector/i })
    fireEvent.click(closeBtn)

    expect(useAppStore.getState().isTemplateSelectorOpen).toBe(false)
  })
})
