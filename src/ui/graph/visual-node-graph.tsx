import React, { useCallback, useState } from 'react'
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
import { LayoutDashboard, Trash2 } from 'lucide-react'
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

  const [connectionWarning, setConnectionWarning] = useState<string | null>(null)

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
      setGraphEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setGraphEdges],
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
    [graphEdges, setGraphEdges],
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
