import { useState } from 'react'
import { Zap, RefreshCw, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

interface NavbarProps {
  onPresetDefault: (institutionId: string) => void
  onReset: () => void
  isSimulating: boolean
}

const PRESETS = [
  { id: 'BANK_CS', label: 'Credit Suisse', tag: 'Stressed' },
  { id: 'BANK_GS', label: 'Goldman Sachs', tag: 'Tier 1' },
  { id: 'BANK_DB', label: 'Deutsche Bank', tag: 'Tier 1' },
  { id: 'FUND_CITADEL', label: 'Citadel', tag: 'Fund' },
]

export default function Navbar({ onPresetDefault, onReset, isSimulating }: NavbarProps) {
  const [openPresets, setOpenPresets] = useState(false)

  return (
    <header className="h-14 panel flex items-center justify-between px-6 z-50 shrink-0 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        {/* Title removed, moved to sidebar */}
        <span className="text-sm font-medium text-gray-300">Network Overview</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="p-2 rounded-md hover:bg-[var(--color-bg-panel-hover)] text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          title="Reset View"
        >
          <RefreshCw size={16} />
          Reset View
        </button>

        <div className="relative">
          <button
            onClick={() => setOpenPresets(p => !p)}
            disabled={isSimulating}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border',
              isSimulating ? 'opacity-50 cursor-not-allowed bg-[var(--color-bg-panel)] border-[var(--color-border)]' : 
              'bg-[#ef4444] hover:bg-[#dc2626] border-[#ef4444] text-white'
            )}
          >
            <Zap size={14} />
            {isSimulating ? 'Simulating...' : 'Simulate Stress Event'}
            <ChevronDown size={14} className="ml-1 opacity-70" />
          </button>

          {openPresets && (
            <div className="absolute top-full mt-1 right-0 w-64 panel rounded-md shadow-lg overflow-hidden flex flex-col z-50">
              <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Select Test Scenario
              </div>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onPresetDefault(p.id); setOpenPresets(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-bg-panel-hover)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                >
                  <span className="text-sm font-medium text-gray-200">
                    {p.label}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-gray-400">
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
