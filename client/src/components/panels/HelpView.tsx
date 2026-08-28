import { BookOpen, Network, Zap, ShieldAlert } from 'lucide-react'

export default function HelpView() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--color-bg-app)] p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3 text-[#3b82f6]">
            <BookOpen size={28} />
            <h1 className="text-3xl font-bold text-white tracking-tight">Help & Glossary</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Understand how to navigate the Contagion Risk Observatory and interpret exposure metrics.
          </p>
        </div>

        {/* Getting Started Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="panel p-6 rounded-lg flex flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
              <Network size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">1. Exploring the Network</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              The main <strong>Network Map</strong> displays financial institutions and their interconnections. 
              Each circle represents a bank, fund, or corporation. Diamonds represent shared collateral pools. 
              <br/><br/>
              Click any node to view its specific details in the right-hand Inspector Panel, including its systemic tier, organization type, and country of origin.
            </p>
          </div>

          <div className="panel p-6 rounded-lg flex flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
              <Zap size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">2. Simulating Stress Events</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              To understand systemic risk, you can simulate a default. Select an institution from the map and click <strong>Simulate Default Event</strong> in the Inspector Panel, or use the quick-select menu in the top navigation bar.
              <br/><br/>
              The system will calculate the downstream impact and highlight all institutions that would suffer direct or indirect losses.
            </p>
          </div>

          <div className="panel p-6 rounded-lg flex flex-col gap-4 md:col-span-2">
            <div className="w-10 h-10 rounded-full bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b]">
              <ShieldAlert size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">3. Analyzing the Blast Radius</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              Once a default is simulated, the map updates to show the "blast radius." Institutions are color-coded based on how closely they are connected to the defaulted entity:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)] p-4 rounded flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#ef4444]">Direct Risk (1st Degree)</span>
                <span className="text-xs text-gray-500">Institutions that trade directly with the failed entity or share a direct collateral pool.</span>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)] p-4 rounded flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#f97316]">Secondary Risk (2nd Degree)</span>
                <span className="text-xs text-gray-500">Institutions exposed to the entities in the 1st degree ring, creating a domino effect.</span>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)] p-4 rounded flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#f59e0b]">Indirect Risk (3rd+ Degree)</span>
                <span className="text-xs text-gray-500">Distant exposure through multiple layers of counterparties. Often hard to track without a graph view.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Glossary */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-bold text-white border-b border-[var(--color-border)] pb-2">Business Glossary</h2>
          
          <div className="flex flex-col divide-y divide-[var(--color-border)] bg-[rgba(255,255,255,0.01)] border border-[var(--color-border)] rounded-lg">
            
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-48 shrink-0 font-semibold text-gray-200">Systemic Tier</div>
              <div className="text-sm text-gray-400">
                A categorization of how important an institution is to the global financial system. <strong>Tier 1</strong> institutions are "too big to fail", while Tier 3 are smaller, localized entities.
              </div>
            </div>
            
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-48 shrink-0 font-semibold text-gray-200">Direct Trading Exposure</div>
              <div className="text-sm text-gray-400">
                A relationship where two entities owe each other money (e.g., through derivatives contracts, loans, or bonds). If one defaults, the other takes a direct loss.
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-48 shrink-0 font-semibold text-gray-200">Shared Collateral Pool</div>
              <div className="text-sm text-gray-400">
                When multiple institutions pledge assets (like government bonds) to the same clearinghouse or pool to cover potential losses. A stress event can drain this pool, impacting all participants.
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-48 shrink-0 font-semibold text-gray-200">Contagion Path</div>
              <div className="text-sm text-gray-400">
                The exact chain of relationships that transmits financial distress from the defaulted institution to a specific victim downstream.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
