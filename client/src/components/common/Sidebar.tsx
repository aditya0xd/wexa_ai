import { Activity, LayoutDashboard, BookOpen } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

export type TabType = 'network' | 'help'

interface SidebarProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 h-full panel border-r border-[var(--color-border)] flex flex-col shrink-0 z-50">
      
      {/* ── Brand ── */}
      <div className="h-14 flex items-center gap-3 px-6 border-b border-[var(--color-border)] shrink-0 bg-[rgba(255,255,255,0.02)]">
        <div className="w-8 h-8 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center">
          <Activity size={18} className="text-[#3b82f6]" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] tracking-tight leading-none text-white">Wexa</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Risk Observatory</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
        <button
          onClick={() => onTabChange('network')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left',
            currentTab === 'network' 
              ? 'bg-[var(--color-bg-panel-hover)] text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--color-bg-panel-hover)]/50'
          )}
        >
          <LayoutDashboard size={18} className={currentTab === 'network' ? 'text-[#3b82f6]' : ''} />
          Network Map
        </button>

        <button
          onClick={() => onTabChange('help')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left',
            currentTab === 'help' 
              ? 'bg-[var(--color-bg-panel-hover)] text-white shadow-sm' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--color-bg-panel-hover)]/50'
          )}
        >
          <BookOpen size={18} className={currentTab === 'help' ? 'text-[#3b82f6]' : ''} />
          Help & Glossary
        </button>
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-gray-500 font-medium text-center">
          FRTB Contagion Simulator v1.0<br/>
          Internal Use Only
        </p>
      </div>
    </aside>
  )
}
