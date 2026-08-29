import { useState } from 'react'
import { EDGE_COLOR, HOP_COLOR } from '../graph/canvasUtils.js'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute top-6 left-6 z-40 panel rounded-lg shadow-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] w-[240px] overflow-hidden flex flex-col transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[var(--color-bg-panel-hover)] hover:bg-[var(--color-border)] transition-colors border-b border-[var(--color-border)]"
      >
        <span className="text-[11px] uppercase font-bold text-[var(--color-text-primary)] tracking-wider flex items-center gap-1.5">
          <Info size={12} />
          Legend & Reference
        </span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {isOpen && (
        <div className="p-3 flex flex-col gap-3.5 overflow-y-auto max-h-[280px]">
          {/* ── Node types and status ── */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[9px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-widest border-b border-[var(--color-border)] pb-0.5">Organizations</h4>
            <div className="flex flex-col gap-1">
              {STATUSES.map(({ key, color, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{label}</span>
                </div>
              ))}
              {/* Pool diamond */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2.5 h-2.5 bg-gray-400 rotate-45 flex-shrink-0 shadow-sm" />
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Shared Collateral Pool</span>
              </div>
            </div>
          </div>

          {/* ── Edges ── */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[9px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-widest border-b border-[var(--color-border)] pb-0.5">Connections</h4>
            <div className="flex flex-col gap-1">
              {EDGES.map(({ type, label }) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="h-0.5 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EDGE_COLOR[type as keyof typeof EDGE_COLOR] }}
                  />
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Contagion hops ── */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[9px] uppercase font-bold tracking-widest border-b border-[var(--color-border)] pb-0.5 text-[var(--color-text-tertiary)]">Risk Proximity</h4>
            <div className="flex flex-col gap-1">
              {HOPS.map(({ hop, label }) => (
                <div key={hop} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: HOP_COLOR[hop] }}
                  />
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
