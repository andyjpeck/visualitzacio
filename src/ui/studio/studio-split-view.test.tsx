import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_STUDIO_SPLIT_RATIO,
  MIN_GRAPH_WIDTH,
  MIN_PREVIEW_WIDTH,
  StudioSplitView,
} from './studio-split-view'
import { useAppStore } from '../store/app-store'

describe('StudioSplitView Component (2-Pane with Collapsible Inspector Drawer)', () => {
  beforeEach(() => {
    useAppStore.setState({
      studioMode: 'editor',
      studioSplitRatio: DEFAULT_STUDIO_SPLIT_RATIO,
      isInspectorOpen: true,
    })
  })

  it('renders preview pane, graph workspace, resizable divider, and inspector drawer in editor mode', () => {
    render(
      <StudioSplitView
        preview={<div data-testid="test-preview">Preview Content</div>}
        graph={<div data-testid="test-graph">Graph Content</div>}
        inspector={<div data-testid="test-inspector">Inspector Content</div>}
      />,
    )

    expect(screen.getByTestId('test-preview')).toBeInTheDocument()
    expect(screen.getByTestId('test-graph')).toBeInTheDocument()
    expect(screen.getByTestId('test-inspector')).toBeInTheDocument()
    expect(screen.getByTestId('studio-divider')).toBeInTheDocument()
    expect(screen.getByTestId('studio-inspector-drawer')).toBeInTheDocument()

    const previewPane = screen.getByTestId('studio-pane-preview')
    const graphPane = screen.getByTestId('studio-pane-graph')

    expect(previewPane.style.width).toBe('50%')
    expect(graphPane.style.width).toBe('50%')
    expect(previewPane.style.minWidth).toBe(`${MIN_PREVIEW_WIDTH}px`)
    expect(graphPane.style.minWidth).toBe(`${MIN_GRAPH_WIDTH}px`)
  })

  it('collapses graph and inspector in live mode, expanding preview to 100%', () => {
    render(
      <StudioSplitView
        preview={<div data-testid="test-preview">Preview Content</div>}
        graph={<div data-testid="test-graph">Graph Content</div>}
        inspector={<div data-testid="test-inspector">Inspector Content</div>}
        mode="live"
      />,
    )

    expect(screen.getByTestId('test-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('test-graph')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-divider')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-inspector-drawer')).not.toBeInTheDocument()

    const previewPane = screen.getByTestId('studio-pane-preview')
    expect(previewPane.style.width).toBe('100%')
  })

  it('resets split ratio to 0.5 when double-clicking the divider', () => {
    useAppStore.setState({ studioSplitRatio: 0.65 })

    render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const previewPane = screen.getByTestId('studio-pane-preview')
    expect(previewPane.style.width).toBe('65%')

    const divider = screen.getByTestId('studio-divider')
    fireEvent.doubleClick(divider)

    expect(useAppStore.getState().studioSplitRatio).toBe(DEFAULT_STUDIO_SPLIT_RATIO)
    expect(previewPane.style.width).toBe('50%')
  })

  it('resizes panes when dragging divider while respecting min-width constraints', () => {
    const { container } = render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const splitContainer = container.querySelector('[data-testid="studio-split-view"]') as HTMLElement
    vi.spyOn(splitContainer, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    const divider = screen.getByTestId('studio-divider')

    // Start dragging divider
    fireEvent.pointerDown(divider)

    // Move pointer to clientX = 400 (40% of 1000px)
    fireEvent.pointerMove(window, { clientX: 400 })

    // Finish dragging
    fireEvent.pointerUp(window)

    const updatedRatio = useAppStore.getState().studioSplitRatio
    expect(updatedRatio).toBeCloseTo(0.4, 2)
  })

  it('clamps divider drag to MIN_PREVIEW_WIDTH (320px)', () => {
    const { container } = render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const splitContainer = container.querySelector('[data-testid="studio-split-view"]') as HTMLElement
    vi.spyOn(splitContainer, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    const divider = screen.getByTestId('studio-divider')
    fireEvent.pointerDown(divider)

    // Try to drag below 320px (e.g. 100px)
    fireEvent.pointerMove(window, { clientX: 100 })
    fireEvent.pointerUp(window)

    const updatedRatio = useAppStore.getState().studioSplitRatio
    // 320 / 1000 = 0.32
    expect(updatedRatio).toBeCloseTo(0.32, 2)
  })

  it('toggles collapsible inspector drawer visibility', () => {
    render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector Content</div>}
      />,
    )

    const drawer = screen.getByTestId('studio-inspector-drawer')
    expect(drawer.className).toContain('translate-x-0')

    // Close drawer
    const closeBtn = screen.getByTestId('studio-inspector-close-button')
    fireEvent.click(closeBtn)

    expect(useAppStore.getState().isInspectorOpen).toBe(false)
    expect(drawer.className).toContain('translate-x-full')

    // Open button should now be visible
    const openBtn = screen.getByTestId('studio-inspector-open-button')
    expect(openBtn).toBeInTheDocument()

    // Click open button
    fireEvent.click(openBtn)
    expect(useAppStore.getState().isInspectorOpen).toBe(true)
    expect(drawer.className).toContain('translate-x-0')
  })
})
