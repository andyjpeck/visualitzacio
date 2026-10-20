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
import {
  ImageIcon,
  Layers,
  LayoutDashboard,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { nodeTypes } from './nodes/node-types'
import { validateConnection } from './validation/connection-validator'
import { autoLayoutGraph } from './layout/auto-layout'
import { useAppStore } from '../store/app-store'

export interface VisualNodeGraphProps {
  className?: string
}

let nextNodeId = 100

function InnerVisualNodeGraph({
  className = '',
}: VisualNodeGraphProps): React.ReactElement {
  const graphNodes = useAppStore((state) => state.graphNodes)
  const graphEdges = useAppStore((state) => state.graphEdges)
  const setGraphNodes = useAppStore((state) => state.setGraphNodes)
  const setGraphEdges = useAppStore((state) => state.setGraphEdges)
  const selectedNodeId = useAppStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId)
  const addGraphNode = useAppStore((state) => state.addGraphNode)
  const removeGraphNode = useAppStore((state) => state.removeGraphNode)

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null)

  // Sync node changes (drag, selection, dimension changes)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setGraphNodes((nds) => applyNodeChanges(changes, nds))
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
    setIsAddMenuOpen(false)
  }, [setSelectedNodeId])

  // Run Dagre auto-layout
  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutGraph(graphNodes, graphEdges)
    setGraphNodes(layouted.nodes)
  }, [graphNodes, graphEdges, setGraphNodes])

  // Add custom node
  const handleAddNode = useCallback(
    (type: 'frameBuffer' | 'staticImage' | 'testVisual') => {
      setIsAddMenuOpen(false)
      const id = `${type}-${++nextNodeId}`
      let newNode: Node

      if (type === 'frameBuffer') {
        newNode = {
          id,
          type: 'frameBuffer',
          position: { x: 220, y: 150 },
          data: {
            label: `Buffer ${nextNodeId}`,
            blendMode: 'screen',
            feedback: true,
            opacity: 0.95,
          },
        }
      } else if (type === 'staticImage') {
        newNode = {
          id,
          type: 'staticImage',
          position: { x: 50, y: 150 },
          data: {
            label: `Image Layer ${nextNodeId}`,
            fitMode: 'cover',
          },
        }
      } else {
        newNode = {
          id,
          type: 'testVisual',
          position: { x: 220, y: 20 },
          data: {
            label: `Synth ${nextNodeId}`,
            shape: 'Crystal',
            reactive: true,
          },
        }
      }

      addGraphNode(newNode)
      setSelectedNodeId(id)
    },
    [addGraphNode, setSelectedNodeId],
  )

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
        {/* Add Node Menu */}
        <div className="relative">
          <button
            type="button"
            data-testid="graph-add-node-button"
            onClick={() => setIsAddMenuOpen((open) => !open)}
            title="Add Node to Graph"
            aria-label="Add Node to Graph"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark/90 hover:bg-cyber-dark border border-white/10 hover:border-cyber-cyan/50 text-slate-200 hover:text-cyber-cyan text-xs font-mono font-semibold shadow-lg shadow-black/60 backdrop-blur-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Add Node</span>
          </button>

          {isAddMenuOpen && (
            <div
              data-testid="graph-add-node-menu"
              className="absolute left-0 top-full mt-1.5 w-48 rounded-xl bg-cyber-dark/95 border border-white/15 shadow-2xl backdrop-blur-xl p-1 z-40 flex flex-col gap-0.5 text-xs font-mono select-none"
            >
              <button
                type="button"
                data-testid="add-node-frame-buffer"
                onClick={() => handleAddNode('frameBuffer')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-950/50 text-slate-300 hover:text-purple-300 transition-colors text-left cursor-pointer"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Frame Buffer</span>
              </button>
              <button
                type="button"
                data-testid="add-node-static-image"
                onClick={() => handleAddNode('staticImage')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/50 text-slate-300 hover:text-emerald-300 transition-colors text-left cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Static Image</span>
              </button>
              <button
                type="button"
                data-testid="add-node-test-visual"
                onClick={() => handleAddNode('testVisual')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-300 hover:text-cyber-cyan transition-colors text-left cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyber-cyan" />
                <span>Crystal Synth</span>
              </button>
            </div>
          )}
        </div>

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

      {/* Cycle Warning Toast */}
      {connectionWarning && (
        <div
          data-testid="graph-connection-warning"
          className="absolute top-3 right-3 z-40 px-3 py-1.5 rounded-lg bg-red-950/90 border border-red-500/80 text-red-200 text-xs font-mono shadow-xl backdrop-blur-md animate-bounce"
        >
          {connectionWarning}
        </div>
      )}

      {/* Interactive React Flow Canvas */}
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
        className="cyberpunk-flow"
      >
        <Background color="#161824" gap={20} size={1.5} />
        <Controls className="!bg-cyber-dark/90 !border-white/10 !text-slate-200 !shadow-xl !backdrop-blur-md" />
        <MiniMap
          nodeStrokeColor="#00f0ff"
          nodeColor="#12131f"
          maskColor="rgba(6, 6, 12, 0.75)"
          className="!bg-[#0a0a14]/90 !border-white/10 rounded-xl overflow-hidden !shadow-2xl !backdrop-blur-md"
        />
      </ReactFlow>
    </div>
  )
}

export function VisualNodeGraph(props: VisualNodeGraphProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <InnerVisualNodeGraph {...props} />
    </ReactFlowProvider>
  )
}
