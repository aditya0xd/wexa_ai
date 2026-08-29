import { X, Info, AlertTriangle, ArrowDown, ShieldAlert, Globe, Layers, TrendingDown } from 'lucide-react'
import type { GraphNode, GraphEdge, Institution, AffectedInstitution, PathStep } from '../../types/graph.types.js'
import { cn } from '../../utils/formatters.js'

const TYPE_DESC: Record<string, string> = {
  Bank: 'Commercial / Investment Bank',
  HedgeFund: 'Private Investment Fund',
  Broker: 'Trading Intermediary',
  Insurer: 'Insurance Company',
  Corporate: 'Non-Financial Corporation',
  CollateralPool: 'Shared Collateral Pool',
}

const REL_DESC: Record<string, string> = {
  TRADES_WITH: 'Direct Trading Exposure',
  POSTS_COLLATERAL: 'Shared Collateral Pool',
  OWNED_BY: 'Ownership Stake',
  mixed: 'Mixed Exposure',
}

const HOP_DESC: Record<number, string> = {
  1: '1st Degree',
  2: '2nd Degree',
  3: '3rd Degree',
  4: '4th Degree',
  5: '5+ Degrees',
}

interface InspectorPanelProps {
  node: GraphNode | null
  institution: Institution | null
  edges: GraphEdge[]
  defaultedNodeId: string | null
  affected: AffectedInstitution[]
  path: PathStep[] | null
  isLoadingPath: boolean
  isLoadingInstitution: boolean
  onClose: () => void
  onSimulateDefault: (id: string) => void
  onShowPath: (toId: string) => void
  isSimulating: boolean
}

export default function InspectorPanel({
  node,
  institution,
  edges,
  defaultedNodeId,
  affected,
  path,
  isLoadingPath,
  isLoadingInstitution,
  onClose,
  onSimulateDefault,
  onShowPath,
  isSimulating,
}: InspectorPanelProps) {
  if (!node) return null

  const isDefaulted = node.id === defaultedNodeId
  const affectedEntry = affected.find(a => a.id === node.id)
  const isPool = node.label === 'CollateralPool'

  // Compute exposure and relationships from global edges
  const formatCurrency = (val: number) => `$${(val / 1000000).toFixed(1)}M`
  
  let totalExposure = 0
  const directRels: { id: string, name?: string, type: string, amount?: number }[] = []

  // Always compute relationships to give full view of the institution's connectivity
  edges.forEach(e => {
    const sourceId = typeof e.source === 'object' ? (e.source as any).id : e.source
    const targetId = typeof e.target === 'object' ? (e.target as any).id : e.target
    
    if (sourceId === node.id || targetId === node.id) {
      if (e.exposure) totalExposure += e.exposure
      
      const otherId = sourceId === node.id ? targetId : sourceId
      const otherNodeName = typeof e.source === 'object' && sourceId !== node.id ? (e.source as any).name : 
                            typeof e.target === 'object' && targetId !== node.id ? (e.target as any).name : otherId
                            
      directRels.push({ id: otherId, name: otherNodeName, type: e.type, amount: e.exposure })
    }
  })

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-96 z-40 panel border-y-0 border-r-0 border-l border-[var(--color-border)] shadow-2xl flex flex-col animate-slide-in-right bg-[var(--color-bg-panel)] overflow-hidden">
      
      {/* ── Header ── */}
      <div className="panel-header p-6 flex flex-col gap-4 shrink-0 border-b border-[var(--color-border)]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {isLoadingInstitution ? (
              <div className="h-3 w-28 bg-[var(--color-border)] rounded animate-pulse" />
            ) : (
              <span className="text-[10px] font-extrabold tracking-widest text-[var(--color-text-tertiary)] uppercase">
                {isPool ? 'Collateral Pool' : institution?.type ? TYPE_DESC[institution.type] : node.label}
              </span>
            )}
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight truncate" title={node.name}>
              {node.name}
            </h2>
            {isLoadingInstitution ? (
              <div className="h-3 w-16 bg-[var(--color-border)] rounded animate-pulse mt-1.5" />
            ) : institution?.country ? (
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-0.5">
                <Globe size={13} className="text-[var(--color-text-tertiary)]" />
                {institution.country}
              </span>
            ) : null}
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-[var(--color-bg-panel-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0 ml-2">
            <X size={16} />
          </button>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wide border uppercase',
            isDefaulted 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : node.status === 'Healthy' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-amber-50 border-amber-200 text-amber-600'
          )}>
            {isDefaulted ? 'DEFAULTED' : node.status ?? 'UNKNOWN'}
          </span>
          {isLoadingInstitution ? (
            <div className="h-[22px] w-14 bg-[var(--color-border)] rounded animate-pulse" />
          ) : institution?.tier ? (
            <span className="text-[10px] font-mono font-semibold text-[var(--color-text-secondary)] px-2.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-app)] flex items-center gap-1">
              <Layers size={10} className="text-[var(--color-text-tertiary)]" />
              {institution.tier}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
        
        {/* ── Action: Simulate Default ── */}
        {!isDefaulted && !isPool && node.label === 'Institution' && (
          <div className="p-6 bg-slate-50/50 flex flex-col gap-3">
            <button
              onClick={() => onSimulateDefault(node.id)}
              disabled={isSimulating}
              className="w-full py-2.5 rounded text-xs font-bold transition-all border bg-red-600 border-red-700 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldAlert size={14} />
              {isSimulating ? 'Simulating...' : 'Simulate Counterparty Default'}
            </button>
            <p className="text-[11px] font-medium text-[var(--color-text-secondary)] text-center leading-normal px-2">
              Trace contagion propagation and default triggers downstream.
            </p>
          </div>
        )}

        {/* ── Contagion Exposure Detail (If it's a victim node) ── */}
        {affectedEntry && (
          <div className="p-6 bg-rose-50/30 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={15} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Contagion Status</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-[var(--color-border)] shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase">Impact Level</span>
                <span className="text-xs font-bold text-[#f59e0b]">
                  {HOP_DESC[affectedEntry.hopDistance] ?? `${affectedEntry.hopDistance} Degrees`}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase">Path Interface</span>
                <span className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={REL_DESC[affectedEntry.pathType]}>
                  {REL_DESC[affectedEntry.pathType] || affectedEntry.pathType}
                </span>
              </div>
            </div>

            <button
              onClick={() => defaultedNodeId && onShowPath(node.id)}
              disabled={isLoadingPath || !defaultedNodeId}
              className="w-full py-2.5 rounded text-xs font-semibold transition-colors border border-[var(--color-border)] hover:bg-[var(--color-bg-panel-hover)] text-[var(--color-text-primary)] shadow-sm bg-white flex items-center justify-center gap-2"
            >
              <TrendingDown size={13} className="text-red-500" />
              {isLoadingPath ? 'Tracing Path...' : 'Trace Transmission Path'}
            </button>
          </div>
        )}

        {/* ── Contagion Path Timeline ── */}
        {path && path.length > 0 && (
          <div className="p-6 bg-slate-50/30 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Transmission Vector</h3>
            <div className="flex flex-col pl-3 border-l-2 border-red-200 gap-5 my-1 ml-1.5">
              {path.map((step, i) => (
                <div key={i} className="relative flex flex-col gap-1.5">
                  {/* Point Indicator */}
                  <div className={cn(
                    "absolute -left-[17px] top-[5px] w-2.5 h-2.5 rounded-full border border-white",
                    i === 0 ? "bg-red-500 shadow-sm shadow-red-500/50" : "bg-orange-500"
                  )} />
                  
                  {/* From Node */}
                  <div className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                    {step.fromId.replace(/_/g, ' ')}
                  </div>
                  
                  {/* Rel Type */}
                  <div className="text-[10px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 bg-white border border-[var(--color-border)] rounded-md px-2.5 py-1 self-start shadow-sm mt-0.5">
                    <ArrowDown size={11} className="text-red-500" />
                    <span>{REL_DESC[step.relType] || step.relType}</span>
                  </div>

                  {/* To Node (only for the last step) */}
                  {i === path.length - 1 && (
                    <div className="relative flex flex-col gap-1.5 mt-4">
                      <div className="absolute -left-[17px] top-[5px] w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-sm shadow-red-600/50" />
                      <div className="text-xs font-bold text-red-600 truncate">
                        {step.toId.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Blast Radius List (If it's the defaulted node) ── */}
        {isDefaulted && affected.length > 0 && (
          <div className="flex flex-col">
            <div className="p-4 bg-red-50/20 border-b border-[var(--color-border)] flex items-center justify-between px-6">
              <h3 className="text-xs font-bold text-[#ef4444] uppercase tracking-wider">Affected Portfolio</h3>
              <span className="text-[10px] font-mono font-bold text-red-600 bg-red-100/50 border border-red-200 px-2 py-0.5 rounded-full">{affected.length} Counterparties</span>
            </div>
            
            <div className="flex flex-col divide-y divide-[var(--color-border)] max-h-64 overflow-y-auto">
              {affected.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-bg-panel-hover)] transition-colors px-6">
                  <div className="flex flex-col gap-0.5 overflow-hidden pr-3">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={a.name}>{a.name}</span>
                    <span className="text-[9px] font-semibold text-[var(--color-text-tertiary)] truncate">{REL_DESC[a.pathType] || a.pathType}</span>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {HOP_DESC[a.hopDistance] ?? `${a.hopDistance}th Degree`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty Contagion State ── */}
        {isDefaulted && affected.length === 0 && !isSimulating && (
          <div className="p-8 flex flex-col items-center justify-center gap-2.5 text-center bg-slate-50/50">
            <Info size={20} className="text-[var(--color-text-tertiary)]" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Systemic Isolation Detected</span>
            <p className="text-[10px] font-medium text-[var(--color-text-secondary)] leading-relaxed max-w-[240px]">
              This entity has no active exposure edges.
            </p>
          </div>
        )}

        {/* ── Institution Profile Details ── */}
        {(institution || isLoadingInstitution) && (
          <div className="p-6 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Institution Profile</h3>
            
            {isLoadingInstitution ? (
              <div className="flex flex-col gap-3.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-dashed border-[var(--color-border)] last:border-b-0">
                    <div className="h-3 w-24 bg-[var(--color-border)] rounded animate-pulse" />
                    <div className="h-3 w-32 bg-[var(--color-border)] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : institution && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-dashed border-[var(--color-border)]">
                  <span className="font-semibold text-[var(--color-text-secondary)]">Organization Type</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{TYPE_DESC[institution.type] || institution.type}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-dashed border-[var(--color-border)]">
                  <span className="font-semibold text-[var(--color-text-secondary)]">Systemic Tier</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{institution.tier}</span>
                </div>
                
                {institution.country && (
                  <div className="flex justify-between items-center text-xs py-1.5">
                    <span className="font-semibold text-[var(--color-text-secondary)]">Jurisdiction</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{institution.country}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Direct Exposure & Relationships ── */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Aggregate Direct Exposure</h3>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-[var(--color-text-primary)]">
                {totalExposure > 0 ? formatCurrency(totalExposure) : '$0.0M'}
              </span>
              <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase">USD</span>
            </div>
          </div>

          {directRels.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Exposure Counterparties</h3>
              <div className="flex flex-col divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-app)]">
                {directRels.map((rel, i) => (
                  <div key={i} className="flex justify-between items-center p-3.5 text-xs hover:bg-[var(--color-bg-panel-hover)] transition-colors">
                    <div className="flex flex-col gap-0.5 truncate max-w-[140px]">
                      <span className="font-bold text-[var(--color-text-primary)] truncate" title={rel.name}>{rel.name}</span>
                      <span className="font-semibold text-[var(--color-text-tertiary)] text-[9px] truncate">{rel.id.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[8px] font-bold font-mono px-2 py-0.5 bg-white border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] shadow-sm">
                        {rel.type}
                      </span>
                      {rel.amount !== undefined && (
                        <span className="font-mono font-bold text-[var(--color-text-secondary)] text-[10px]">
                          {formatCurrency(rel.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
