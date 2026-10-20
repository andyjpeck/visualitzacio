import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_INSPECTOR_VERTICAL_RATIO,
  DEFAULT_STUDIO_SPLIT_RATIO,
  MIN_GRAPH_HEIGHT,
  MIN_GRAPH_WIDTH,
  MIN_INSPECTOR_HEIGHT,
  MIN_PREVIEW_WIDTH,
  StudioSplitView,
} from './studio-split-view'
import { useAppStore } from '../store/app-store'

describe('StudioSplitView Component (Vertically Stacked Inspector on Top & Node Graph on Bottom)', () => {
  beforeEach(() => {
    useAppStore.setState({
      studioMode: 'editor',
      studioSplitRatio: DEFAULT_STUDIO_SPLIT_RATIO,
      inspectorVerticalRatio: DEFAULT_INSPECTOR_VERTICAL_RATIO,
    })
  })

  it('renders preview pane, right column with inspector on top, horizontal divider, and node graph in editor mode', () => {
    render(
      <StudioSplitView
        preview={<div data-testid="test-preview">Preview Content</div>}
        graph={<div data-testid="test-graph">Graph Content</div>}
        inspector={<div data-testid="test-inspector">Inspector Content</div>}
      />,
    )

    expect(screen.getByTestId('test-preview')).toBeInTheDocument()
    expect(screen.getByTestId('test-inspector')).toBeInTheDocument()
    expect(screen.getByTestId('test-graph')).toBeInTheDocument()

    expect(screen.getByTestId('studio-divider-vertical')).toBeInTheDocument()
    expect(screen.getByTestId('studio-divider-horizontal')).toBeInTheDocument()

    const previewPane = screen.getByTestId('studio-pane-preview')
    const rightColumn = screen.getByTestId('studio-pane-right-column')
    const inspectorPane = screen.getByTestId('studio-pane-inspector')
    const graphPane = screen.getByTestId('studio-pane-graph')

    expect(previewPane.style.width).toBe('50%')
    expect(rightColumn.style.width).toBe('50%')
    expect(previewPane.style.minWidth).toBe(`${MIN_PREVIEW_WIDTH}px`)
    expect(rightColumn.style.minWidth).toBe(`${MIN_GRAPH_WIDTH}px`)

    expect(inspectorPane.style.height).toBe('45%')
    expect(graphPane.style.height).toBe('55%')
    expect(inspectorPane.style.minHeight).toBe(`${MIN_INSPECTOR_HEIGHT}px`)
    expect(graphPane.style.minHeight).toBe(`${MIN_GRAPH_HEIGHT}px`)
  })

  it('collapses right column in live mode, expanding preview to 100%', () => {
    render(
      <StudioSplitView
        preview={<div data-testid="test-preview">Preview Content</div>}
        graph={<div data-testid="test-graph">Graph Content</div>}
        inspector={<div data-testid="test-inspector">Inspector Content</div>}
        mode="live"
      />,
    )

    expect(screen.getByTestId('test-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('test-inspector')).not.toBeInTheDocument()
    expect(screen.queryByTestId('test-graph')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-divider-vertical')).not.toBeInTheDocument()
    expect(screen.queryByTestId('studio-divider-horizontal')).not.toBeInTheDocument()

    const previewPane = screen.getByTestId('studio-pane-preview')
    expect(previewPane.style.width).toBe('100%')
  })

  it('resets horizontal split ratio to 0.5 when double-clicking vertical divider', () => {
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

    const verticalDivider = screen.getByTestId('studio-divider-vertical')
    fireEvent.doubleClick(verticalDivider)

    expect(useAppStore.getState().studioSplitRatio).toBe(DEFAULT_STUDIO_SPLIT_RATIO)
    expect(previewPane.style.width).toBe('50%')
  })

  it('resets inspector vertical ratio to 0.45 when double-clicking horizontal divider', () => {
    useAppStore.setState({ inspectorVerticalRatio: 0.6 })

    render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const inspectorPane = screen.getByTestId('studio-pane-inspector')
    expect(inspectorPane.style.height).toBe('60%')

    const horizontalDivider = screen.getByTestId('studio-divider-horizontal')
    fireEvent.doubleClick(horizontalDivider)

    expect(useAppStore.getState().inspectorVerticalRatio).toBe(
      DEFAULT_INSPECTOR_VERTICAL_RATIO,
    )
    expect(inspectorPane.style.height).toBe('45%')
  })

  it('resizes panes when dragging vertical divider while respecting min-width constraints', () => {
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

    const divider = screen.getByTestId('studio-divider-vertical')
    fireEvent.pointerDown(divider)

    // Move pointer to clientX = 400 (40% of 1000px)
    fireEvent.pointerMove(window, { clientX: 400 })
    fireEvent.pointerUp(window)

    const updatedRatio = useAppStore.getState().studioSplitRatio
    expect(updatedRatio).toBeCloseTo(0.4, 2)
  })

  it('clamps vertical divider drag to MIN_PREVIEW_WIDTH (320px)', () => {
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

    const divider = screen.getByTestId('studio-divider-vertical')
    fireEvent.pointerDown(divider)

    // Try to drag below 320px (e.g. 100px)
    fireEvent.pointerMove(window, { clientX: 100 })
    fireEvent.pointerUp(window)

    const updatedRatio = useAppStore.getState().studioSplitRatio
    expect(updatedRatio).toBeCloseTo(0.32, 2)
  })

  it('resizes inspector and node graph when dragging horizontal divider while respecting min-height constraints', () => {
    const { container } = render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const rightColumn = container.querySelector(
      '[data-testid="studio-pane-right-column"]',
    ) as HTMLElement

    vi.spyOn(rightColumn, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 1000,
      top: 0,
      left: 500,
      right: 1000,
      bottom: 1000,
      x: 500,
      y: 0,
      toJSON: () => {},
    })

    const divider = screen.getByTestId('studio-divider-horizontal')
    fireEvent.pointerDown(divider)

    // Move pointer down to clientY = 350 (35% of 1000px)
    fireEvent.pointerMove(window, { clientY: 350 })
    fireEvent.pointerUp(window)

    const updatedRatio = useAppStore.getState().inspectorVerticalRatio
    expect(updatedRatio).toBeCloseTo(0.35, 2)
  })

  it('clamps horizontal divider drag to MIN_INSPECTOR_HEIGHT (180px)', () => {
    const { container } = render(
      <StudioSplitView
        preview={<div>Preview</div>}
        graph={<div>Graph</div>}
        inspector={<div>Inspector</div>}
      />,
    )

    const rightColumn = container.querySelector(
      '[data-testid="studio-pane-right-column"]',
    ) as HTMLElement

    vi.spyOn(rightColumn, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 1000,
      top: 0,
      left: 500,
      right: 1000,
      bottom: 1000,
      x: 500,
      y: 0,
      toJSON: () => {},
    })

    const divider = screen.getByTestId('studio-divider-horizontal')
    fireEvent.pointerDown(divider)

    // Try to drag above 180px (e.g. clientY = 50px)
    fireEvent.pointerMove(window, { clientY: 50 })
    fireEvent.pointerUp(window)

    const updatedRatio = useAppStore.getState().inspectorVerticalRatio
    // 180 / 1000 = 0.18
    expect(updatedRatio).toBeCloseTo(0.18, 2)
  })
})
