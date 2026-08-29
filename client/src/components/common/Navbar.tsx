import { useState, useRef, useEffect } from 'react'
import { Zap, RefreshCw, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../utils/formatters.js'
import type { GraphNode } from '../../types/graph.types.js'

interface NavbarProps {
  nodes: GraphNode[]
  onPresetDefault: (institutionId: string) => void
  onReset: () => void
  onSearchSelect: (node: GraphNode) => void
  isSimulating: boolean
}

const PRESETS = [
  { id: 'BANK_CS', label: 'Credit Suisse', tag: 'Stressed' },
  { id: 'BANK_GS', label: 'Goldman Sachs', tag: 'Tier 1' },
  { id: 'BANK_DB', label: 'Deutsche Bank', tag: 'Tier 1' },
  { id: 'FUND_CITADEL', label: 'Citadel', tag: 'Fund' },
]

export default function Navbar({ nodes, onPresetDefault, onReset, onSearchSelect, isSimulating }: NavbarProps) {
  const [openPresets, setOpenPresets] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Filter nodes for search (exclude CollateralPools if we only want to search institutions)
  const searchResults = nodes
    .filter(n => n.label === 'Institution' && (n.name?.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase())))
    .slice(0, 5)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="h-16 panel flex items-center justify-between px-6 z-50 shrink-0 border-x-0 border-t-0 border-b border-[var(--color-border)] shadow-sm relative bg-[var(--color-bg-app)]">
      <div className="flex flex-col justify-center">
        <h1 className="text-[16px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
          Financial Network Contagion Simulator
        </h1>
        <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mt-0.5">
          Explore how a counterparty default propagates through interconnected financial institutions.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-44 sm:w-64" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search institutions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{ paddingLeft: '2.25rem', paddingRight: '2rem' }}
              className="w-full py-1.5 text-sm rounded bg-white border border-[var(--color-border)] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-all text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                <X size={14} />
              </button>
            )}
          </div>
          {isSearchFocused && searchQuery && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 panel rounded-md shadow-xl overflow-hidden z-50 bg-white">
              {searchResults.map(n => (
                <button
                  key={n.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-bg-panel-hover)] border-b border-[var(--color-border)] last:border-b-0 flex flex-col"
                  onClick={() => {
                    onSearchSelect(n)
                    setIsSearchFocused(false)
                    setSearchQuery('')
                  }}
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{n.name}</span>
                  <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{n.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded bg-[var(--color-bg-panel)] hover:bg-[var(--color-bg-panel-hover)] text-[var(--color-text-secondary)] transition-colors flex items-center gap-2 text-sm font-medium border border-[var(--color-border)] shadow-sm whitespace-nowrap flex-shrink-0"
          title="Reset Simulation"
        >
          <RefreshCw size={14} />
          Reset
        </button>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOpenPresets(p => !p)}
            disabled={isSimulating}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border shadow-sm whitespace-nowrap flex-shrink-0',
              isSimulating ? 'opacity-50 cursor-not-allowed bg-[var(--color-bg-panel)] border-[var(--color-border)] text-[var(--color-text-secondary)]' : 
              'bg-[#ef4444] hover:bg-[#dc2626] border-[#ef4444] text-white'
            )}
          >
            <Zap size={14} />
            {isSimulating ? 'Simulating...' : 'Simulate Stress Event'}
            <ChevronDown size={14} className="ml-1 opacity-70" />
          </button>

          {openPresets && (
            <div className="absolute top-full mt-2 right-0 w-64 panel rounded-md shadow-xl overflow-hidden flex flex-col z-50">
              <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-app)] text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider">
                Select Test Scenario
              </div>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onPresetDefault(p.id); setOpenPresets(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-bg-panel-hover)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                >
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {p.label}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    {p.tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
