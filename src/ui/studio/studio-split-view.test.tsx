import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_STUDIO_SPLIT_RATIOS,
  MIN_GRAPH_WIDTH,
  MIN_INSPECTOR_WIDTH,
  MIN_PREVIEW_WIDTH,
  StudioSplitView,
} from './studio-split-view'
import { useAppStore } from '../store/app-store'

describe('StudioSplitView Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      studioMode: 'editor',
      studioSplitRatios: [...DEFAULT_STUDIO_SPLIT_RATIOS],
    })
  })

  it('renders all 3 panes and 2 dividers in editor mode', () => {
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

    expect(screen.getByTestId('studio-divider-1')).toBeInTheDocument()
    expect(screen.getByTestId('studio-divider-2')).toBeInTheDocument()

    const previewPane = screen.getByTestId('studio-pane-preview')
    const graphPane = screen.getByTestId('studio-pane-graph')
    const inspectorPane = screen.getByTestId('studio-pane-inspector')

    expect(previewPane.style.width).toBe('35%')
    expect(graphPane.style.width).toBe('40%')
    expect(inspectorPane.style.width).toBe('25%')
    expect(previewPane.style.minWidth).toBe(`${MIN_PREVIEW_WIDTH}px`)
    expect(graphPane.style.minWidth).toBe(`${MIN_GRAPH_WIDTH}px`)
    expect(inspectorPane.style.minWidth).toBe(`${MIN_INSPECTOR_WIDTH}px`)
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
    expect(screen.queryByTestId('test-inspector')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-divider-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-divider-2')).not.toBeInTheDocument()

    const previewPane = screen.getByTestId('studio-pane-preview')
    expect(previewPane.style.width).toBe('100%')
  })

  it('resets split ratios to default when double-clicking a divider', () => {
    useAppStore.setState({
      studioSplitRatios: [0.5, 0.3, 0.2],
    })

    render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const previewPane = screen.getByTestId('studio-pane-preview')
    expect(previewPane.style.width).toBe('50%')

    const divider1 = screen.getByTestId('studio-divider-1')
    fireEvent.doubleClick(divider1)

    expect(useAppStore.getState().studioSplitRatios).toEqual(
      DEFAULT_STUDIO_SPLIT_RATIOS,
    )
    expect(previewPane.style.width).toBe('35%')
  })

  it('resizes panes when dragging divider 1 while respecting min-width constraints', () => {
    const { container } = render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const splitContainer = container.querySelector('[data-testid="studio-split-view"]') as HTMLElement
    // In a 2000px container, all min-widths (320px, 400px, 300px) are easily met
    vi.spyOn(splitContainer, 'getBoundingClientRect').mockReturnValue({
      width: 2000,
      height: 1000,
      top: 0,
      left: 0,
      right: 2000,
      bottom: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    const divider1 = screen.getByTestId('studio-divider-1')

    // Start dragging divider 1
    fireEvent.pointerDown(divider1)

    // Move pointer to clientX = 900 (45% of 2000px)
    fireEvent.pointerMove(window, { clientX: 900 })

    // Finish dragging
    fireEvent.pointerUp(window)

    const updatedRatios = useAppStore.getState().studioSplitRatios
    expect(updatedRatios[0]).toBeCloseTo(0.45, 2)
    expect(updatedRatios[2]).toBeCloseTo(0.25, 2)
    expect(updatedRatios[1]).toBeCloseTo(0.3, 2)
  })

  it('clamps divider 1 drag to MIN_PREVIEW_WIDTH (320px)', () => {
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

    const divider1 = screen.getByTestId('studio-divider-1')
    fireEvent.pointerDown(divider1)

    // Try to drag divider 1 below 320px (e.g. 100px)
    fireEvent.pointerMove(window, { clientX: 100 })
    fireEvent.pointerUp(window)

    const updatedRatios = useAppStore.getState().studioSplitRatios
    // 320 / 1000 = 0.32
    expect(updatedRatios[0]).toBeCloseTo(0.32, 2)
  })

  it('resizes panes when dragging divider 2 while respecting min-width constraints', () => {
    const { container } = render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const splitContainer = container.querySelector('[data-testid="studio-split-view"]') as HTMLElement
    vi.spyOn(splitContainer, 'getBoundingClientRect').mockReturnValue({
      width: 2000,
      height: 1000,
      top: 0,
      left: 0,
      right: 2000,
      bottom: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    const divider2 = screen.getByTestId('studio-divider-2')
    fireEvent.pointerDown(divider2)

    // Move divider 2 to clientX = 1300 (inspector width = 2000 - 1300 = 700px = 35%)
    fireEvent.pointerMove(window, { clientX: 1300 })
    fireEvent.pointerUp(window)

    const updatedRatios = useAppStore.getState().studioSplitRatios
    expect(updatedRatios[2]).toBeCloseTo(0.35, 2)
    expect(updatedRatios[0]).toBeCloseTo(0.35, 2)
    expect(updatedRatios[1]).toBeCloseTo(0.3, 2)
  })
})
