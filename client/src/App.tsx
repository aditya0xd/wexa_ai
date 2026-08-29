import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react'
import './App.css'
import { api } from './services/api.js'
import type { GraphNode, GraphEdge, Institution, AffectedInstitution, PathStep } from './types/graph.types.js'
import Navbar from './components/common/Navbar.js'
import Legend from './components/common/Legend.js'
import InspectorPanel from './components/panels/InspectorPanel.js'
import NetworkGraph from './components/graph/NetworkGraph.js'
import HelpView from './components/panels/HelpView.js'

// ── App state types ────────────────────────────────────────
type LoadState = 'idle' | 'loading' | 'error'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  // Null initial state so the graph never mounts with 0x0 dimensions.
  // Dimensions are read synchronously (useLayoutEffect) before the first paint
  // so there's no async race between ResizeObserver firing and data arriving.
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  // Navigation state
  const [currentTab, setCurrentTab] = useState<'network' | 'help'>('network')

  // Graph data
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Selection state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [isLoadingInstitution, setIsLoadingInstitution] = useState(false)

  // Simulation state
  const [defaultedId, setDefaultedId] = useState<string | null>(null)
  const [affected, setAffected] = useState<AffectedInstitution[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  // Path state
  const [path, setPath] = useState<PathStep[] | null>(null)
  const [isLoadingPath, setIsLoadingPath] = useState(false)

  // ── Responsive sizing ──
  // useLayoutEffect reads the container size synchronously before the browser paints,
  // so dimensions are available on the very first render where nodes are shown.
  // This eliminates the 0→real-size transition that caused the graph to jump on load.
  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      if (width > 0 && height > 0) setDimensions({ width, height })
    }
  }, [])

  useEffect(() => {
    let rafId: number
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        // Debounce via rAF: ResizeObserver can fire multiple times in quick succession
        // on first paint, each causing a canvas resize that resets D3's viewport.
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height })
        })
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => { observer.disconnect(); cancelAnimationFrame(rafId) }
  }, [])

  // ── Load network graph on mount ──
  // loadNetwork is kept as a standalone function so the Retry button can call it directly.
  const loadNetwork = useCallback(async () => {
    setLoadState('loading')
    setErrorMsg(null)
    try {
      const { data } = await api.getNetwork() as any
      setNodes(data.nodes ?? [])
      setEdges(data.edges ?? [])
      setLoadState('idle')
    } catch (e: any) {
      if ((e as any)?.name === 'AbortError') return // ignore StrictMode cleanup cancellation
      setErrorMsg(e.message ?? 'Failed to load network graph')
      setLoadState('error')
    }
  }, [])

  // React 18 StrictMode double-invokes effects in dev, which would fire two API calls.
  // The AbortController cancels the first in-flight request when StrictMode unmounts
  // the component before remounting it, so only the second (real) mount's request completes.
  useEffect(() => {
    const controller = new AbortController()
    setLoadState('loading')
    setErrorMsg(null)
    api.getNetwork(controller.signal)
      .then(({ data }: any) => {
        if (controller.signal.aborted) return
        setNodes(data.nodes ?? [])
        setEdges(data.edges ?? [])
        setLoadState('idle')
      })
      .catch((e: any) => {
        if (controller.signal.aborted) return
        setErrorMsg(e.message ?? 'Failed to load network graph')
        setLoadState('error')
      })
    return () => controller.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node)
    setFocusedNodeId(node.id) // Also focus on click so graph pans smoothly if not centered
    setPath(null)
    if (node.label !== 'CollateralPool') {
      setIsLoadingInstitution(true)
      try {
        const res = await api.getInstitution(node.id) as any
        setInstitution(res.data ?? res)
      } catch {
        setInstitution(null)
      } finally {
        setIsLoadingInstitution(false)
      }
    } else {
      setInstitution(null)
    }
  }, [])

  // ── Node search select ──
  const handleSearchSelect = useCallback((node: GraphNode) => {
    setFocusedNodeId(node.id)
    handleNodeClick(node)
  }, [handleNodeClick])

  // ── Simulate default ──
  const handleSimulateDefault = useCallback(async (institutionId: string) => {
    // If user is on Help tab, switch them back to network tab so they see the result
    if (currentTab !== 'network') {
      setCurrentTab('network')
    }
    
    setIsSimulating(true)
    setDefaultedId(institutionId)
    setAffected([])
    setPath(null)

    // Auto-select the defaulted node
    const node = nodes.find(n => n.id === institutionId) ?? null
    if (node) {
      setSelectedNode({ ...node, status: 'Defaulted' })
      setInstitution(null)
      setIsLoadingInstitution(true)
      api.getInstitution(node.id)
        .then((res: any) => setInstitution(res.data ?? res))
        .catch(() => setInstitution(null))
        .finally(() => setIsLoadingInstitution(false))
    }

    try {
      const res = await api.simulateDefault(institutionId) as any
      const result = res.data ?? res
      setAffected(result.affected ?? [])
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Simulation failed')
    } finally {
      setIsSimulating(false)
    }
  }, [nodes, currentTab])

  // ── Show contagion path ──
  const handleShowPath = useCallback(async (toId: string) => {
    if (!defaultedId) return
    setIsLoadingPath(true)
    setPath(null)
    try {
      const res = await api.getPath(defaultedId, toId) as any
      const result = res.data ?? res
      setPath(result.path ?? [])
    } catch {
      setPath([])
    } finally {
      setIsLoadingPath(false)
    }
  }, [defaultedId])

  const handleReset = useCallback(() => {
    setDefaultedId(null)
    setAffected([])
    setSelectedNode(null)
    setFocusedNodeId(null)
    setInstitution(null)
    setPath(null)
    setErrorMsg(null)
  }, [])

  // Stable displayNodes: only creates a new object reference when a node's status actually
  // needs to change. Nodes that already carry the correct status (or are unaffected) are
  // returned as-is, so D3's graphData memo sees minimal reference churn and the simulation
  // does not restart on every defaultedId update.
  const displayNodes = useMemo<GraphNode[]>(() => {
    return nodes.map(n => {
      if (n.id === defaultedId && n.status !== 'Defaulted') {
        return { ...n, status: 'Defaulted' as const }
      }
      return n
    })
  }, [nodes, defaultedId])

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      {/* ── Top Navbar ── */}
      <Navbar
        nodes={nodes}
        onPresetDefault={handleSimulateDefault}
        onReset={handleReset}
        onSearchSelect={handleSearchSelect}
        isSimulating={isSimulating}
      />

      {/* ── Main Content Area ── */}
      <main className="flex-1 relative overflow-hidden" ref={containerRef}>
        {currentTab === 'help' ? (
          <HelpView />
        ) : (
          <>
            {loadState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[#2563eb] animate-spin" />
                <span className="telemetry text-[var(--color-text-secondary)]">Loading Network Graph...</span>
              </div>
            )}

            {loadState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30 bg-white/50 backdrop-blur-sm">
                <div className="panel p-8 flex flex-col items-center gap-4 max-w-sm text-center rounded-lg shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg font-bold border border-red-200">!</div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Database Unreachable</h2>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {errorMsg}
                  </p>
                  <button
                    onClick={loadNetwork}
                    className="px-4 py-2 bg-[var(--color-bg-panel-hover)] hover:bg-[var(--color-border)] rounded-md text-sm font-bold transition-colors border border-[var(--color-border-active)] mt-2 text-[var(--color-text-primary)]"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            {loadState === 'idle' && nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-30">
                <span className="telemetry text-[var(--color-text-secondary)]">No Network Data Found</span>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Run <code className="font-mono font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-panel)] px-1 py-0.5 rounded border border-[var(--color-border)]">npm run seed</code> in the server to populate CognoDB.
                </p>
              </div>
            )}

            {/* ── Graph Canvas ── */}
            {nodes.length > 0 && dimensions !== null && (
              <>
                {!selectedNode && !defaultedId && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/90 backdrop-blur border border-[var(--color-border)] px-4 py-2 rounded-full shadow-sm pointer-events-none whitespace-nowrap max-w-[90%] text-center">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      Select an institution to inspect its exposures or simulate a default.
                    </p>
                  </div>
                )}
                <NetworkGraph
                  nodes={displayNodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id ?? null}
                  focusedNodeId={focusedNodeId}
                  defaultedNodeId={defaultedId}
                  affected={affected}
                  path={path}
                  onNodeClick={handleNodeClick}
                  width={dimensions!.width}
                  height={dimensions!.height}
                />
              </>
            )}

            {/* ── Left HUD: Legend ── */}
            <Legend />

            {/* ── Bottom Center HUD: Simulation Summary ── */}
            {defaultedId && affected.length > 0 && (
              <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 panel bg-[var(--color-bg-panel)] rounded-lg px-6 py-4 flex items-center gap-4 shadow-xl border-l-4 border-l-[#ef4444] transition-all duration-300 ${
                selectedNode ? 'translate-x-[calc(-50%-192px)]' : ''
              }`}>
                <span className="text-sm font-bold text-[#ef4444]">
                  {affected.length} Institutions Affected
                </span>
                <div className="w-px h-6 bg-[var(--color-border)]" />
                <span className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                  Max Contagion Depth: <span className="font-mono font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-app)] border border-[var(--color-border)] px-2 py-0.5 rounded">{Math.max(...affected.map(a => a.hopDistance))} {Math.max(...affected.map(a => a.hopDistance)) === 1 ? 'Degree' : 'Degrees'}</span>
                </span>
              </div>
            )}

            {/* ── Right Sidebar: Inspector Panel ── */}
            <InspectorPanel
              node={selectedNode}
              institution={institution}
              edges={edges}
              defaultedNodeId={defaultedId}
              affected={affected}
              path={path}
              isLoadingPath={isLoadingPath}
              isLoadingInstitution={isLoadingInstitution}
              onClose={() => { setSelectedNode(null); setInstitution(null); setPath(null); setFocusedNodeId(null) }}
              onSimulateDefault={handleSimulateDefault}
              onShowPath={handleShowPath}
              isSimulating={isSimulating}
            />
          </>
        )}
      </main>
    </div>
  )
}
