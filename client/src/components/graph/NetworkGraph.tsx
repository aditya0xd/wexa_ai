import { useEffect, useRef, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphNode, GraphEdge, AffectedInstitution, PathStep } from '../../types/graph.types.js'
import { drawNode, edgeColor, HOP_COLOR } from './canvasUtils.js'

interface NetworkGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  focusedNodeId: string | null
  defaultedNodeId: string | null
  affected: AffectedInstitution[]
  path: PathStep[] | null
  onNodeClick: (node: GraphNode) => void
  width: number
  height: number
}

export default function NetworkGraph({
  nodes,
  edges,
  selectedNodeId,
  focusedNodeId,
  defaultedNodeId,
  affected,
  path,
  onNodeClick,
  width,
  height,
}: NetworkGraphProps) {
  const fgRef = useRef<any>(null)

  // Configure D3 forces and set initial zoom atomically when the graph instance mounts.
  // Using a ref callback (not useEffect) ensures this runs before D3's simulation loop
  // starts — avoiding any visible kick from forces or zoom changing mid-run.
  const fgRefCallback = useCallback((instance: any) => {
    if (instance && instance !== fgRef.current) {
      fgRef.current = instance
      instance.d3Force('charge')?.strength(-120)
      instance.d3Force('link')?.distance(50)
      // Set a sensible initial zoom level. ForceGraph2D defaults to fitting the viewport
      // which can feel jarring. A fixed zoom-1 start gives the user a consistent anchor.
      instance.zoom(1, 0)
    }
  }, [])

  // Memoized hop-distance lookup — rebuilding a Map on every canvas frame tick
  // (which happens 60×/s) is wasteful; this only recomputes when affected changes.
  const hopMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of affected) map.set(a.id, a.hopDistance)
    return map
  }, [affected])

  // FIX #3: Pre-compute path edges as a Set for O(1) lookups.
  // Previously, linkColor/linkWidth/linkDirectionalParticles each called path.some()
  // per edge per animation frame (60fps × N edges × P path steps = enormous waste).
  // Now each callback just calls pathEdgeSet.has() — constant time.
  const pathEdgeSet = useMemo(() => {
    const s = new Set<string>()
    if (path) {
      for (const step of path) {
        s.add(`${step.fromId}|${step.toId}`)
        s.add(`${step.toId}|${step.fromId}`) // treat edges as undirected for highlighting
      }
    }
    return s
  }, [path])


  // Keep nodes in a ref to prevent camera refocusing when node data mutates (e.g., simulation status updates)
  const nodesRef = useRef(nodes)
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])


  // Center on focused node only when focusedNodeId changes (smooth pan, no zoom change)
  useEffect(() => {
    if (focusedNodeId && fgRef.current) {
      const node = nodesRef.current.find(n => n.id === focusedNodeId)
      if (node && (node as any).x !== undefined && (node as any).y !== undefined) {
        fgRef.current.centerAt((node as any).x, (node as any).y, 800)
      }
    }
  }, [focusedNodeId])

  // FIX #2: Stable node position preservation across re-memos.
  // The old code spread-cloned nodes fresh on every memo. D3 writes x/y/vx/vy onto
  // its own clone objects — NOT the originals. So when nodes/edges changed, the new
  // clones started at undefined positions, causing the entire layout to reset and
  // re-simulate from scratch. This stable Map carries D3-annotated positions forward.
  const stableNodeMap = useRef<Map<string, any>>(new Map())

  const graphData = useMemo(() => {
    const map = stableNodeMap.current
    const stableNodes = nodes.map(n => {
      const prev = map.get(n.id)
      // Merge latest React data with any D3-written position data from previous render
      const merged = prev
        ? { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy }
        : { ...n }
      map.set(n.id, merged)
      return merged
    })
    // Prune removed nodes from the map to avoid stale memory accumulation
    for (const key of map.keys()) {
      if (!stableNodes.find(n => n.id === key)) map.delete(key)
    }
    return {
      nodes: stableNodes,
      links: edges.map((e) => ({
        ...e,
        source: typeof e.source === 'object' ? (e.source as GraphNode).id : e.source,
        target: typeof e.target === 'object' ? (e.target as GraphNode).id : e.target,
      })),
    }
  }, [nodes, edges])

  return (
    <div className="relative w-full h-full">
      <ForceGraph2D
        ref={fgRefCallback}
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
          // FIX #5: nodeVal controls the pointer hit-area radius in 'replace' mode.
          // The old values (14/10/8) were mismatched from the actual drawn NODE_RADIUS
          // (12/9/7/6), making clicks misaligned. Match them exactly here.
          if (node.label === 'CollateralPool') return 6
          const tier = node.tier as string
          return tier === 'Tier1' ? 12 : tier === 'Tier2' ? 9 : 7
        }}
        // ── Link rendering ──
        linkColor={(link: any) => {
          const fromId = typeof link.source === 'object' ? link.source.id : link.source
          const toId   = typeof link.target === 'object' ? link.target.id : link.target

          // FIX #3: O(1) Set lookup instead of path.some() scan per frame
          const isPathActive = pathEdgeSet.size > 0
          const isPathEdge = pathEdgeSet.has(`${fromId}|${toId}`)

          if (isPathActive) {
            return isPathEdge ? '#ef4444' : '#cbd5e11a' // Focus heavily on path edges
          }

          const fromHop = hopMap.get(fromId)
          const toHop   = hopMap.get(toId)
          const isContagion =
            (fromId === defaultedNodeId || fromHop !== undefined) &&
            (toId   === defaultedNodeId || toHop   !== undefined)

          if (isContagion) {
            const hop = Math.min(fromHop ?? 99, toHop ?? 99)
            return (HOP_COLOR[hop] ?? HOP_COLOR[5] ?? '#84cc16') + 'b3' // 70% opacity for contagion
          }

          // If a simulation is active, fade unrelated edges
          return defaultedNodeId ? '#cbd5e144' : edgeColor(link.type) + '99'
        }}
        linkWidth={(link: any) => {
          const fromId = typeof link.source === 'object' ? link.source.id : link.source
          const toId   = typeof link.target === 'object' ? link.target.id : link.target

          // FIX #3: O(1) Set lookup
          const isPathActive = pathEdgeSet.size > 0
          const isPathEdge = pathEdgeSet.has(`${fromId}|${toId}`)

          if (isPathActive) {
            return isPathEdge ? 4.0 : 0.5
          }

          const isContagion =
            (fromId === defaultedNodeId || hopMap.has(fromId)) &&
            (toId   === defaultedNodeId || hopMap.has(toId))

          return isContagion ? 2 : 1
        }}
        linkCurvature={(link: any) => link.type === 'OWNED_BY' ? 0.25 : 0}
        linkDirectionalParticles={(link: any) => {
          const fromId = typeof link.source === 'object' ? link.source.id : link.source
          const toId   = typeof link.target === 'object' ? link.target.id : link.target

          // FIX #3: O(1) Set lookup
          const isPathEdge = pathEdgeSet.has(`${fromId}|${toId}`)

          // Particles only flow on the active explanation path, matching "why was this institution affected?"
          return isPathEdge ? 3 : 0
        }}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={3}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        // onZoom fires on every zoom event (scroll wheel, pinch, programmatic).
        // We don't need to track anything here — fgRef.current.zoom() is always
        // current by the time a button click handler runs synchronously.
        cooldownTicks={120}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
      />

      {/* Floating Zoom and Navigation controls overlay */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-1.5 bg-white/95 backdrop-blur border border-[var(--color-border)] p-1.5 rounded-lg shadow-lg">
        <button 
          onClick={() => {
            // Read actual current zoom directly — no ref needed because this runs
            // synchronously after all animations have settled (button click, not mid-frame).
            const next = Math.min((fgRef.current?.zoom() ?? 1) * 1.3, 8)
            fgRef.current?.zoom(next, 300)
          }} 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-bg-panel-hover)] font-bold text-base text-[var(--color-text-primary)] transition-colors border border-[var(--color-border)] bg-white shadow-sm"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={() => {
            const next = Math.max((fgRef.current?.zoom() ?? 1) / 1.3, 0.1)
            fgRef.current?.zoom(next, 300)
          }} 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-bg-panel-hover)] font-bold text-base text-[var(--color-text-primary)] transition-colors border border-[var(--color-border)] bg-white shadow-sm"
          title="Zoom Out"
        >
          -
        </button>
        <button 
          onClick={() => fgRef.current?.zoomToFit(400, 40)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--color-bg-panel-hover)] text-xs text-[var(--color-text-primary)] font-semibold transition-colors border border-[var(--color-border)] bg-white shadow-sm"
          title="Fit Network"
        >
          Fit
        </button>
      </div>
    </div>
  )
}
