import React, { useCallback, useEffect, useState } from 'react'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import { Check, Copy, LayoutDashboard, Trash2 } from 'lucide-react'
import { nodeTypes } from './nodes/node-types'
import { validateConnection } from './validation/connection-validator'
import { autoLayoutGraph } from './layout/auto-layout'
import {
  MIN_CHILD_X,
  MIN_CHILD_Y,
  recalculateContainerBounds,
} from './layout/container-bounds'
import { useAppStore } from '../store/app-store'

export interface VisualNodeGraphProps {
  className?: string
}

function InnerVisualNodeGraph({
  className = '',
}: VisualNodeGraphProps): React.ReactElement {
  const graphNodes = useAppStore((state) => state.graphNodes)
  const graphEdges = useAppStore((state) => state.graphEdges)
  const setGraphNodes = useAppStore((state) => state.setGraphNodes)
  const setGraphEdges = useAppStore((state) => state.setGraphEdges)
  const selectedNodeId = useAppStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const removeGraphNode = useAppStore((state) => state.removeGraphNode)
  const updateGraphNodeData = useAppStore((state) => state.updateGraphNodeData)

  const [connectionWarning, setConnectionWarning] = useState<string | null>(null)
  const [copiedJson, setCopiedJson] = useState(false)

  // TEMPORARY(Track 4 Phase 2/3): Fast preset/layout JSON copy for user debugging.
  // Must be removed when Task 4.3 (Preset Deserializer & Import Handlers) is completed.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { __getGraphLayout?: () => unknown }).__getGraphLayout =
        () => ({
          timestamp: new Date().toISOString(),
          nodes: graphNodes,
          edges: graphEdges,
        })
    }
  }, [graphNodes, graphEdges])

  const handleCopyLayoutJson = useCallback(() => {
    const layout = {
      timestamp: new Date().toISOString(),
      nodes: graphNodes,
      edges: graphEdges,
    }
    const jsonStr = JSON.stringify(layout, null, 2)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).catch(() => {
        // fallback if permissions fail
      })
    }
    console.log('[Visualització] Current Graph Layout JSON:\n', jsonStr)
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }, [graphNodes, graphEdges])

  // Sync node changes (drag, selection, dimension changes)
  // Enforces that child nodes inside containers cannot be dragged over the container header
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setGraphNodes((prevNodes) => {
        const sanitizedChanges = changes.map((change) => {
          if (change.type === 'position' && change.position) {
            const node = prevNodes.find((n) => n.id === change.id)
            if (node?.parentId) {
              return {
                ...change,
                position: {
                  x: Math.max(MIN_CHILD_X, change.position.x),
                  y: Math.max(MIN_CHILD_Y, change.position.y),
                },
              }
            }
          }
          return change
        })

        const updated = applyNodeChanges(sanitizedChanges, prevNodes)
        const hasPositionChange = changes.some((c) => c.type === 'position')
        return hasPositionChange ? recalculateContainerBounds(updated) : updated
      })
    },
    [setGraphNodes],
  )

  // Sync edge changes (removal, selection)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          const removedEdge = graphEdges.find((e) => e.id === change.id)
          if (removedEdge && removedEdge.sourceHandle === 'buffer-out' && removedEdge.target) {
            updateGraphNodeData(removedEdge.target, { loadFrom: '' })
          }
        }
      }
      setGraphEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [graphEdges, setGraphEdges, updateGraphNodeData],
  )

  // Handle new edge connection with validation & cycle prevention
  const onConnect = useCallback(
    (connection: Connection) => {
      const validation = validateConnection(connection, graphEdges)
      if (!validation.valid) {
        setConnectionWarning(validation.reason || 'Invalid connection')
        setTimeout(() => setConnectionWarning(null), 3000)
        return
      }

      setConnectionWarning(null)
      const isBuffer = connection.sourceHandle === 'buffer-out'

      if (isBuffer && connection.source && connection.target) {
        const sourceNode = graphNodes.find((n) => n.id === connection.source)
        const targetNode = graphNodes.find((n) => n.id === connection.target)
        if (sourceNode && targetNode) {
          let tag = typeof sourceNode.data?.saveTo === 'string' ? sourceNode.data.saveTo.trim() : ''
          if (!tag || tag === '@') {
            const cleanLabel = String(sourceNode.data?.label || sourceNode.id)
              .replace(/[^a-zA-Z0-9]/g, '_')
              .toUpperCase()
            tag = `@${cleanLabel}`
            updateGraphNodeData(sourceNode.id, { saveTo: tag })
          }
          const patch: Record<string, unknown> = { loadFrom: tag }
          if (!targetNode.data?.inputBlendMode || targetNode.data?.inputBlendMode === 'none') {
            patch.inputBlendMode = 'replace'
          }
          updateGraphNodeData(targetNode.id, patch)
        }
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${connection.sourceHandle || 'exec'}`,
        animated: true,
        style: {
          stroke: isBuffer ? '#a855f7' : '#00f0ff',
          strokeWidth: 2,
        },
      }
      setGraphEdges((eds) => addEdge(newEdge, eds))
    },
    [graphEdges, graphNodes, setGraphEdges, updateGraphNodeData],
  )

  // Handle node selection
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId],
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  // Run Dagre auto-layout
  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutGraph(graphNodes, graphEdges)
    setGraphNodes(layouted.nodes)
  }, [graphNodes, graphEdges, setGraphNodes])

  // Delete currently selected node
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      removeGraphNode(selectedNodeId)
    }
  }, [selectedNodeId, removeGraphNode])

  const isMasterSelected = selectedNodeId === 'master-frame-buffer'

  // Map nodes with dynamic selected property
  const nodesWithSelection = graphNodes.map((n) => ({
    ...n,
    selected: n.id === selectedNodeId,
  }))

  return (
    <div
      data-testid="visual-node-graph"
      className={`relative w-full h-full overflow-hidden bg-[#06060c] ${className}`}
    >
      {/* Top Floating Graph Action Bar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        {/* Auto-Layout Button */}
        <button
          type="button"
          data-testid="graph-auto-layout-button"
          onClick={handleAutoLayout}
          title="Auto-Layout Graph (Dagre DAG)"
          aria-label="Auto-Layout Graph"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark/90 hover:bg-cyber-dark border border-white/10 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 text-xs font-mono font-semibold shadow-lg shadow-black/60 backdrop-blur-md transition-all cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto-Layout</span>
        </button>

        {/* TEMPORARY(Track 4 Phase 2/3): Fast Copy Layout JSON Button */}
        <button
          type="button"
          data-testid="graph-copy-json-button"
          onClick={handleCopyLayoutJson}
          title="Copy Graph Layout JSON to Clipboard"
          aria-label="Copy Graph Layout JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark/90 hover:bg-cyber-dark border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-cyan-300 text-xs font-mono font-semibold shadow-lg shadow-black/60 backdrop-blur-md transition-all cursor-pointer"
        >
          {copiedJson ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy JSON</span>
            </>
          )}
        </button>

        {/* Delete Selected Node Button */}
        {selectedNodeId && !isMasterSelected && (
          <button
            type="button"
            data-testid="graph-delete-node-button"
            onClick={handleDeleteSelected}
            title="Delete Selected Node"
            aria-label="Delete Selected Node"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 hover:border-red-500 text-red-300 text-xs font-mono font-semibold shadow-lg shadow-black/60 backdrop-blur-md transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Floating Connection Warning Pill */}
      {connectionWarning && (
        <div className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-lg bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-mono shadow-xl backdrop-blur-md animate-fade-in">
          ⚠️ {connectionWarning}
        </div>
      )}

      {/* React Flow Viewport Canvas */}
      <ReactFlow
        nodes={nodesWithSelection}
        edges={graphEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
        className="bg-[#06060c]"
      >
        <Background color="#161b26" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-cyber-dark/80 !border-white/10 !rounded-xl overflow-hidden !shadow-xl fill-slate-300"
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'masterFrameBuffer') return '#f59e0b'
            if (node.type === 'frameBuffer') return '#a855f7'
            if (node.type === 'staticImage') return '#10b981'
            return '#00f0ff'
          }}
          maskColor="rgba(6, 6, 12, 0.7)"
          className="!bg-cyber-dark/80 !border-white/10 !rounded-xl overflow-hidden !shadow-xl"
        />
      </ReactFlow>
    </div>
  )
}

/**
 * Visual Node Graph component wrapped in ReactFlowProvider.
 */
export function VisualNodeGraph(props: VisualNodeGraphProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <InnerVisualNodeGraph {...props} />
    </ReactFlowProvider>
  )
}
