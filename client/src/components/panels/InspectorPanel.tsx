import { X, Info, AlertTriangle } from 'lucide-react'
import type { GraphNode, Institution, AffectedInstitution, PathStep } from '../../types/graph.types.js'
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
}

const HOP_DESC: Record<number, string> = {
  1: 'Directly Connected',
  2: '1 Step Removed',
  3: '2 Steps Removed',
  4: '3 Steps Removed',
  5: '4+ Steps Removed',
}

interface InspectorPanelProps {
  node: GraphNode | null
  institution: Institution | null
  defaultedNodeId: string | null
  affected: AffectedInstitution[]
  path: PathStep[] | null
  isLoadingPath: boolean
  onClose: () => void
  onSimulateDefault: (id: string) => void
  onShowPath: (toId: string) => void
  isSimulating: boolean
}

export default function InspectorPanel({
  node,
  institution,
  defaultedNodeId,
  affected,
  path,
  isLoadingPath,
  onClose,
  onSimulateDefault,
  onShowPath,
  isSimulating,
}: InspectorPanelProps) {
  if (!node) return null

  const isDefaulted = node.id === defaultedNodeId
  const affectedEntry = affected.find(a => a.id === node.id)
  const isPool = node.label === 'CollateralPool'

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-96 z-40 panel border-y-0 border-r-0 border-l border-[var(--color-border)] shadow-2xl flex flex-col animate-slide-in-right bg-[var(--color-bg-panel)]">
      
      {/* ── Header ── */}
      <div className="panel-header p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
              {isPool ? 'Collateral Pool' : institution?.type ? TYPE_DESC[institution.type] : node.label}
            </span>
            <h2 className="text-lg font-semibold text-white leading-tight">
              {node.name}
            </h2>
            {institution?.country && (
              <span className="text-xs text-gray-400">{institution.country}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--color-bg-panel-hover)] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded',
            node.status === 'Healthy' ? 'bg-healthy' :
            node.status === 'Stressed' ? 'bg-stressed' : 'bg-defaulted'
          )}>
            {isDefaulted ? 'DEFAULTED' : node.status?.toUpperCase()}
          </span>
          {institution?.tier && (
            <span className="text-xs font-mono text-gray-400 px-2 py-0.5 rounded border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)]">
              {institution.tier}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* ── Action: Simulate Default ── */}
        {!isDefaulted && !isPool && node.label === 'Institution' && (
          <div className="p-5 border-b border-[var(--color-border)]">
            <button
              onClick={() => onSimulateDefault(node.id)}
              disabled={isSimulating}
              className="w-full py-2.5 rounded text-sm font-medium transition-colors border bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSimulating ? 'Simulating...' : 'Simulate Default Event'}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2">
              Analyze network contagion if this institution fails.
            </p>
          </div>
        )}

        {/* ── Contagion Exposure Detail (If it's a victim node) ── */}
        {affectedEntry && (
          <div className="p-5 border-b border-[var(--color-border)] bg-[rgba(239,68,68,0.02)] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#ef4444]">
              <AlertTriangle size={14} />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Contagion Exposure</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Separation</span>
                <span className="text-sm font-semibold text-[#f59e0b]">{HOP_DESC[affectedEntry.hopDistance] ?? `${affectedEntry.hopDistance} Hops`}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Connection</span>
                <span className="text-sm text-gray-200">{REL_DESC[affectedEntry.pathType]}</span>
              </div>
            </div>

            <button
              onClick={() => defaultedNodeId && onShowPath(node.id)}
              disabled={isLoadingPath || !defaultedNodeId}
              className="w-full py-2 rounded text-xs font-medium transition-colors border border-[var(--color-border)] hover:bg-[var(--color-bg-panel-hover)] text-white"
            >
              {isLoadingPath ? 'Tracing Path...' : 'Trace Connection Path'}
            </button>
          </div>
        )}

        {/* ── Contagion Path Breadcrumb ── */}
        {path && path.length > 0 && (
          <div className="p-5 border-b border-[var(--color-border)] flex flex-col gap-3 bg-[rgba(255,255,255,0.01)]">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Exposure Path</h3>
            {path.map((step, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="text-xs text-gray-300 flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[var(--color-border)] flex items-center justify-center text-[9px] font-mono">{i+1}</div>
                  {step.fromId.replace(/_/g, ' ')}
                </div>
                <div className="flex items-center gap-2 ml-2 my-1">
                  <div className="w-px h-4 bg-gray-600" />
                  <span className="text-[10px] text-gray-500">{REL_DESC[step.relType]}</span>
                </div>
                {i === path.length - 1 && (
                  <div className="text-xs font-semibold text-[#ef4444] flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[rgba(239,68,68,0.2)] flex items-center justify-center text-[9px] font-mono">{i+2}</div>
                    {step.toId.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Blast Radius List (If it's the defaulted node) ── */}
        {isDefaulted && affected.length > 0 && (
          <div className="p-0 flex flex-col">
            <div className="p-4 border-b border-[var(--color-border)] bg-[rgba(239,68,68,0.02)] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#ef4444] uppercase tracking-wider">Affected Institutions</h3>
              <span className="text-xs font-mono text-gray-400 bg-[var(--color-bg-panel)] px-2 py-0.5 rounded border border-[var(--color-border)]">{affected.length}</span>
            </div>
            
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {affected.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                  <div className="flex flex-col gap-1 overflow-hidden pr-4">
                    <span className="text-sm text-gray-200 truncate" title={a.name}>{a.name}</span>
                    <span className="text-[10px] text-gray-500 truncate">{REL_DESC[a.pathType]}</span>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--color-bg-panel-hover)] border border-[var(--color-border)] text-gray-300">
                      Hop {a.hopDistance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty Contagion State ── */}
        {isDefaulted && affected.length === 0 && !isSimulating && (
          <div className="p-6 flex flex-col items-center justify-center gap-3 text-center border-b border-[var(--color-border)]">
            <Info size={24} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-300">No Downstream Impact</span>
            <p className="text-xs text-gray-500 leading-relaxed">
              This institution has no direct trading connections or shared collateral pools within 5 hops.
            </p>
          </div>
        )}

        {/* ── Institution Profile Details ── */}
        {institution && !isDefaulted && (
          <div className="p-5 flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Profile Details</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-400">Org Type</span>
                <span className="text-sm text-gray-200 text-right">{TYPE_DESC[institution.type] || institution.type}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-400">Systemic Tier</span>
                <span className="text-sm text-gray-200">{institution.tier}</span>
              </div>
              
              {institution.country && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Country</span>
                  <span className="text-sm text-gray-200">{institution.country}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </aside>
  )
}
