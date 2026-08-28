import { useEffect, useRef, useCallback, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphNode, GraphEdge, AffectedInstitution } from '../../types/graph.types.js'
import { drawNode, edgeColor, HOP_COLOR } from './canvasUtils.js'

interface NetworkGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  defaultedNodeId: string | null
  affected: AffectedInstitution[]
  onNodeClick: (node: GraphNode) => void
  width: number
  height: number
}

export default function NetworkGraph({
  nodes,
  edges,
  selectedNodeId,
  defaultedNodeId,
  affected,
  onNodeClick,
  width,
  height,
}: NetworkGraphProps) {
  const fgRef = useRef<any>(null)
  const [graphReady, setGraphReady] = useState(false)

  // Build hop-distance lookup from affected list
  const hopMap = new Map<string, number>()
  for (const a of affected) hopMap.set(a.id, a.hopDistance)

  // Zoom to fit after graph stabilises
  const onEngineStop = useCallback(() => {
    if (!graphReady) {
      fgRef.current?.zoomToFit(600, 80)
      setGraphReady(true)
    }
  }, [graphReady])

  // Re-fit when new simulation result comes in
  useEffect(() => {
    if (affected.length > 0) {
      setTimeout(() => fgRef.current?.zoomToFit(600, 80), 200)
    }
  }, [affected.length])

  // Graph data with links renamed for react-force-graph-2d
  const graphData = {
    nodes,
    links: edges.map((e) => ({
      ...e,
      source: typeof e.source === 'object' ? (e.source as GraphNode).id : e.source,
      target: typeof e.target === 'object' ? (e.target as GraphNode).id : e.target,
    })),
  }

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={width}
      height={height}
      backgroundColor="transparent"
      // ── Node rendering ──
      nodeId="id"
      nodeCanvasObject={(node: any, ctx, globalScale) => {
        const isSelected = node.id === selectedNodeId
        const isDefaulted = node.id === defaultedNodeId
        const hop = hopMap.get(node.id) ?? null
        drawNode(ctx, node, isSelected, isDefaulted, hop, globalScale)
      }}
      nodeCanvasObjectMode={() => 'replace'}
      nodeVal={(node: any) => {
        const tier = node.tier as string
        return tier === 'Tier1' ? 14 : tier === 'Tier2' ? 10 : 8
      }}
      // ── Link rendering ──
      linkColor={(link: any) => {
        const fromId = typeof link.source === 'object' ? link.source.id : link.source
        const toId   = typeof link.target === 'object' ? link.target.id : link.target
        const fromHop = hopMap.get(fromId)
        const toHop   = hopMap.get(toId)
        const isContagion =
          (fromId === defaultedNodeId || fromHop !== undefined) &&
          (toId   === defaultedNodeId || toHop   !== undefined)
        if (isContagion) {
          const hop = Math.min(fromHop ?? 99, toHop ?? 99)
          return HOP_COLOR[hop] ?? HOP_COLOR[5] ?? '#84cc16'
        }
        return edgeColor(link.type) + '66' // Semi-transparent clean lines
      }}
      linkWidth={(link: any) => {
        const fromId = typeof link.source === 'object' ? link.source.id : link.source
        const toId   = typeof link.target === 'object' ? link.target.id : link.target
        const isContagion =
          (fromId === defaultedNodeId || hopMap.has(fromId)) &&
          (toId   === defaultedNodeId || hopMap.has(toId))
        return isContagion ? 2 : 1
      }}
      linkCurvature={(link: any) => link.type === 'OWNED_BY' ? 0.25 : 0}
      linkDirectionalParticles={(link: any) => {
        const fromId = typeof link.source === 'object' ? link.source.id : link.source
        const toId   = typeof link.target === 'object' ? link.target.id : link.target
        const isContagion =
          (fromId === defaultedNodeId || hopMap.has(fromId)) &&
          (toId   === defaultedNodeId || hopMap.has(toId))
        // Use clean small particles for active paths
        return isContagion ? 2 : 0
      }}
      linkDirectionalParticleSpeed={0.005}
      linkDirectionalParticleWidth={3}
      linkDirectionalArrowLength={4}
      linkDirectionalArrowRelPos={1}
      onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
      // @ts-expect-error onEngineStop is missing from ForceGraphProps types
      onEngineStop={onEngineStop}
      cooldownTicks={120}
      enableNodeDrag
      enableZoomInteraction
      enablePanInteraction
    />
  )
}
