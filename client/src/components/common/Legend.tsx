import { EDGE_COLOR, HOP_COLOR } from '../graph/canvasUtils.js'
import { Info } from 'lucide-react'

const EDGES = [
  { type: 'TRADES_WITH', label: 'Direct Trading Exposure' },
  { type: 'POSTS_COLLATERAL', label: 'Shared Collateral Pool' },
  { type: 'OWNED_BY', label: 'Ownership Stake' },
]

const STATUSES = [
  { key: 'Healthy', color: '#10b981', label: 'Stable' },
  { key: 'Stressed', color: '#f59e0b', label: 'Under Stress' },
  { key: 'Defaulted', color: '#ef4444', label: 'Collapsed / Defaulted' },
]

const HOPS = [
  { hop: 1, label: 'Direct Exposure (1st Degree)' },
  { hop: 2, label: 'Secondary Exposure (2nd Degree)' },
  { hop: 3, label: 'Indirect Exposure (3rd+ Degree)' },
]

export default function Legend() {
  return (
    <div className="absolute bottom-6 left-6 z-40 panel rounded-lg p-6 flex flex-col gap-6 w-[280px] shadow-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)]">
      
      {/* ── Node types and status ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2">
          <Info size={14} className="text-gray-400" />
          <h4 className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Organizations</h4>
        </div>
        <div className="flex flex-col gap-2">
          {STATUSES.map(({ key, color, label }) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[13px] text-gray-300">Financial Institution — {label}</span>
            </div>
          ))}
          {/* Pool diamond */}
          <div className="flex items-center gap-3 mt-1">
            <div className="w-3 h-3 bg-gray-400 rotate-45 flex-shrink-0" />
            <span className="text-[13px] text-gray-300">Shared Asset / Collateral Pool</span>
          </div>
        </div>
      </div>

      {/* ── Edges ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2">
          <Info size={14} className="text-gray-400" />
          <h4 className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Types of Connections</h4>
        </div>
        <div className="flex flex-col gap-2.5">
          {EDGES.map(({ type, label }) => (
            <div key={type} className="flex items-center gap-3">
              <div
                className="h-[3px] w-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: EDGE_COLOR[type as keyof typeof EDGE_COLOR] }}
              />
              <span className="text-[13px] text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contagion hops ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2">
          <Info size={14} className="text-gray-400" />
          <h4 className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Risk Proximity</h4>
        </div>
        <div className="flex flex-col gap-2">
          {HOPS.map(({ hop, label }) => (
            <div key={hop} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: HOP_COLOR[hop] }}
              />
              <span className="text-[13px] text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
