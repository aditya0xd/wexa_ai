import { useEffect, useState, useCallback, useRef } from 'react'
import './App.css'
import { api } from './services/api.js'
import type { GraphNode, GraphEdge, Institution, AffectedInstitution, PathStep } from './types/graph.types.js'
import Navbar from './components/common/Navbar.js'
import Legend from './components/common/Legend.js'
import InspectorPanel from './components/panels/InspectorPanel.js'
import NetworkGraph from './components/graph/NetworkGraph.js'
import Sidebar, { type TabType } from './components/common/Sidebar.js'
import HelpView from './components/panels/HelpView.js'

// ── App state types ────────────────────────────────────────
type LoadState = 'idle' | 'loading' | 'error'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  // Navigation state
  const [currentTab, setCurrentTab] = useState<TabType>('network')

  // Graph data
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Selection state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [institution, setInstitution] = useState<Institution | null>(null)

  // Simulation state
  const [defaultedId, setDefaultedId] = useState<string | null>(null)
  const [affected, setAffected] = useState<AffectedInstitution[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  // Path state
  const [path, setPath] = useState<PathStep[] | null>(null)
  const [isLoadingPath, setIsLoadingPath] = useState(false)

  // ── Responsive sizing ──
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // ── Load network graph on mount ──
  const loadNetwork = useCallback(async () => {
    setLoadState('loading')
    setErrorMsg(null)
    try {
      const { data } = await api.getNetwork() as any
      setNodes(data.nodes ?? [])
      setEdges(data.edges ?? [])
      setLoadState('idle')
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Failed to load network graph')
      setLoadState('error')
    }
  }, [])

  useEffect(() => { loadNetwork() }, [loadNetwork])

  // ── Node click → fetch institution details ──
  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node)
    setPath(null)
    if (node.label !== 'CollateralPool') {
      try {
        const res = await api.getInstitution(node.id) as any
        setInstitution(res.data ?? res)
      } catch {
        setInstitution(null)
      }
    } else {
      setInstitution(null)
    }
  }, [])

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

  // ── Reset ──
  const handleReset = useCallback(() => {
    setDefaultedId(null)
    setAffected([])
    setSelectedNode(null)
    setInstitution(null)
    setPath(null)
    setErrorMsg(null)
  }, [])

  // ── Mutated nodes for visual state ──
  const displayNodes: GraphNode[] = nodes.map(n => {
    if (n.id === defaultedId) return { ...n, status: 'Defaulted' }
    return n
  })

  return (
    <div className="w-full h-full relative overflow-hidden flex bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      
      {/* ── Left Sidebar ── */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── Top Navbar ── */}
        <Navbar
          onPresetDefault={handleSimulateDefault}
          onReset={handleReset}
          isSimulating={isSimulating}
        />

        {/* ── View Area ── */}
        <main className="flex-1 relative overflow-hidden" ref={containerRef}>
          
          {currentTab === 'help' ? (
            <HelpView />
          ) : (
            <>
              {loadState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin" />
                  <span className="telemetry text-gray-400">Loading Network Graph...</span>
                </div>
              )}

              {loadState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-30 bg-black/50 backdrop-blur-sm">
                  <div className="panel p-8 flex flex-col items-center gap-4 max-w-sm text-center rounded-lg shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-lg font-bold border border-red-500/30">!</div>
                    <h2 className="text-lg font-semibold text-white">Database Unreachable</h2>
                    <p className="text-sm text-gray-400">
                      {errorMsg}
                    </p>
                    <button
                      onClick={loadNetwork}
                      className="px-4 py-2 bg-[var(--color-border)] hover:bg-[var(--color-border-active)] rounded-md text-sm font-medium transition-colors border border-[var(--color-border-active)] mt-2"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}

              {loadState === 'idle' && nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-30">
                  <span className="telemetry text-gray-500">No Network Data Found</span>
                  <p className="text-sm text-gray-400">
                    Run <code className="font-mono text-gray-300 bg-[var(--color-bg-panel)] px-1 py-0.5 rounded border border-[var(--color-border)]">npm run seed</code> in the server to populate CognoDB.
                  </p>
                </div>
              )}

              {/* ── Graph Canvas ── */}
              {nodes.length > 0 && (
                <NetworkGraph
                  nodes={displayNodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id ?? null}
                  defaultedNodeId={defaultedId}
                  affected={affected}
                  onNodeClick={handleNodeClick}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              )}

              {/* ── Left HUD: Legend ── */}
              <Legend />

              {/* ── Bottom Center HUD: Simulation Summary ── */}
              {defaultedId && affected.length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 panel rounded-md px-6 py-3 flex items-center gap-4 shadow-lg border-l-4 border-l-[#ef4444]">
                  <span className="text-sm font-semibold text-[#ef4444]">
                    {affected.length} Institutions Affected
                  </span>
                  <div className="w-px h-4 bg-[var(--color-border)]" />
                  <span className="text-sm text-gray-400">
                    Max Exposure: <span className="font-mono font-medium text-white">{Math.max(...affected.map(a => a.hopDistance))} Hops</span>
                  </span>
                </div>
              )}

              {/* ── Right Sidebar: Inspector Panel ── */}
              <InspectorPanel
                node={selectedNode}
                institution={institution}
                defaultedNodeId={defaultedId}
                affected={affected}
                path={path}
                isLoadingPath={isLoadingPath}
                onClose={() => { setSelectedNode(null); setInstitution(null); setPath(null) }}
                onSimulateDefault={handleSimulateDefault}
                onShowPath={handleShowPath}
                isSimulating={isSimulating}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
