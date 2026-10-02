import React, { useState } from 'react';
import { MetricWidget, Deviation, ActionItem, Pillar } from '../types';
import { 
  BarChart3, Activity, Award, CheckCircle2, TrendingUp, Cpu, Landmark, HardHat,
  Plus, Check, Flame, ThumbsUp, DollarSign, PieChart, Shield, Leaf, Coins,
  Sliders, ArrowUpRight, HelpCircle
} from 'lucide-react';

interface StrategicDashboardProps {
  widgets: MetricWidget[];
  deviations: Deviation[];
  actionItems: ActionItem[];
  userRole: string;
  onUpdateDeviation?: (id: string, updates: Partial<Deviation>) => void;
  onAddCustomWidget?: (widget: Omit<MetricWidget, 'id' | 'state'>) => void;
}

interface CI_Idea {
  id: string;
  title: string;
  pillar: Pillar;
  estimatedSaving: number;
  capitalCost: number;
  votes: number;
  status: 'draft' | 'approved' | 'implemented';
  submittedBy: string;
}

export default function StrategicDashboard({
  widgets,
  deviations,
  actionItems,
  userRole,
  onUpdateDeviation,
  onAddCustomWidget,
}: StrategicDashboardProps) {
  // Continuous Improvement Ideas list state
  const [ideas, setIdeas] = useState<CI_Idea[]>([
    { id: 'ci-1', title: 'Solar pre-heater installation for boiler feed water', pillar: 'Sustainability', estimatedSaving: 14500, capitalCost: 35000, votes: 14, status: 'approved', submittedBy: 'Sarah M.' },
    { id: 'ci-2', title: 'Pneumatic sensor replacements to eliminate air leaks', pillar: 'Cost', estimatedSaving: 8200, capitalCost: 1500, votes: 22, status: 'implemented', submittedBy: 'John D.' },
    { id: 'ci-3', title: 'Optical sorting camera at exit of extruder cell #2', pillar: 'Quality', estimatedSaving: 28000, capitalCost: 12000, votes: 18, status: 'draft', submittedBy: 'Alex T.' },
    { id: 'ci-4', title: 'Ergonomic heavy-lifting hoist for box packing station', pillar: 'Safety', estimatedSaving: 5000, capitalCost: 8000, votes: 9, status: 'draft', submittedBy: 'Elena R.' }
  ]);

  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaPillar, setIdeaPillar] = useState<Pillar>('Sustainability');
  const [ideaSaving, setIdeaSaving] = useState('');
  const [ideaCost, setIdeaCost] = useState('');

  // Interactive Sliders for Annual Budget Planner (Monthly editability - Request #3)
  const [capexAllocation, setCapexAllocation] = useState<number>(450); // $k
  const [opexBudget, setOpexBudget] = useState<number>(320); // $k

  // Custom Strategic Targets (Dynamic editing in Monthly Pulse)
  const [annualPaybackProgress, setAnnualPaybackProgress] = useState<number>(114800);
  const [annualPaybackTarget, setAnnualPaybackTarget] = useState<number>(160000);
  const [copqTarget, setCopqTarget] = useState<number>(10000);
  const [copqActual, setCopqActual] = useState<number>(14200);
  const [co2Target, setCopco2Target] = useState<number>(15);
  const [co2Actual, setCopco2Actual] = useState<number>(12.5);

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle) return;

    const newIdea: CI_Idea = {
      id: `ci-${Date.now()}`,
      title: ideaTitle,
      pillar: ideaPillar,
      estimatedSaving: parseFloat(ideaSaving) || 0,
      capitalCost: parseFloat(ideaCost) || 0,
      votes: 1,
      status: 'draft',
      submittedBy: 'Strategic Board Planner'
    };

    setIdeas([newIdea, ...ideas]);
    setIdeaTitle('');
    setIdeaSaving('');
    setIdeaCost('');
  };

  const handleVote = (id: string) => {
    setIdeas(ideas.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i));
  };

  const handleUpdateIdeaStatus = (id: string, status: any) => {
    setIdeas(ideas.map(i => i.id === id ? { ...i, status } : i));
  };

  // Connected Feature: Fund an unresolved deviation with Strategic Capex (Request #2)
  const handleFundDeviationWithCapex = (dev: Deviation) => {
    const funding = Math.floor(10000 + Math.random() * 25000); // randomize capex funding size
    
    // 1. Mark deviation as funded in state
    if (onUpdateDeviation) {
      onUpdateDeviation(dev.id, { fundedAmount: funding, isResolved: true });
    }

    // 2. Automatically spawn a funded Continuous Improvement project in the incubator list!
    const newProject: CI_Idea = {
      id: `ci-funded-${Date.now()}`,
      title: `CAPEX RESOLUTION: Address root cause for "${dev.widgetTitle}" - ${dev.rootCause || dev.description}`,
      pillar: dev.pillar,
      estimatedSaving: Math.round(funding * 0.4), // 40% returns
      capitalCost: funding,
      votes: 5,
      status: 'approved',
      submittedBy: 'Corporate Finance'
    };
    
    setIdeas([newProject, ...ideas]);

    // 3. Deduct from our Capex Slider to simulate dynamic allocation!
    setCapexAllocation(prev => Math.max(50, prev - Math.round(funding / 1000)));
  };

  // Compute stats
  const totalDeviations = deviations.length;
  const resolvedDeviations = deviations.filter(d => d.isResolved).length;
  const resolutionRate = totalDeviations > 0 ? Math.round((resolvedDeviations / totalDeviations) * 100) : 100;

  // Count deviations by pillar
  const pillarStats = deviations.reduce((acc, dev) => {
    acc[dev.pillar] = (acc[dev.pillar] || 0) + 1;
    return acc;
  }, {} as Record<Pillar, number>);

  const getPillarColor = (p: Pillar) => {
    switch (p) {
      case 'Safety': return 'bg-rose-500';
      case 'Sustainability': return 'bg-emerald-500';
      case 'Quality': return 'bg-blue-500';
      case 'Delivery': return 'bg-amber-500';
      case 'Cost': return 'bg-slate-700';
      case 'Capital': return 'bg-[#FFC20E]';
    }
  };

  // Strategic Alerts: deviations awaiting capital attention
  const openAlertDeviations = deviations.filter(d => !d.isResolved && !d.fundedAmount);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Monthly strategic KPI overview (With live editable inputs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Overall Operational Health */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operational Health Goal</span>
          <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white mt-1 block">94.2%</span>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3">
            <div className="h-full bg-[#FFC20E] rounded-full" style={{ width: '94.2%' }}></div>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1.5">Epiroc Sweden T3 Standard</span>
        </div>

        {/* KPI 2: Strategic COPQ (Editable) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cost of Poor Quality (COPQ)</span>
            <span className="text-[9px] font-bold text-rose-500 font-mono">T3 Edit</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[8px] text-slate-400 uppercase">Actual ($)</label>
              <input 
                type="number" 
                value={copqActual}
                onChange={(e) => setCopqActual(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 p-1 rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[8px] text-slate-400 uppercase">Target ($)</label>
              <input 
                type="number" 
                value={copqTarget}
                onChange={(e) => setCopqTarget(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 p-1 rounded"
              />
            </div>
          </div>
          <span className={`text-[10px] block mt-1.5 font-bold ${copqActual > copqTarget ? 'text-rose-500' : 'text-emerald-500'}`}>
            Variance: +${(copqActual - copqTarget).toLocaleString()} {copqActual > copqTarget ? 'Loss' : 'Savings'}
          </span>
        </div>

        {/* KPI 3: CO2 Reductions (Editable) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CO2 Offsets (%)</span>
            <span className="text-[9px] font-bold text-emerald-500 font-mono">T3 Edit</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[8px] text-slate-400 uppercase">Actual %</label>
              <input 
                type="number" 
                value={co2Actual}
                onChange={(e) => setCopco2Actual(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 p-1 rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[8px] text-slate-400 uppercase">Target %</label>
              <input 
                type="number" 
                value={co2Target}
                onChange={(e) => setCopco2Target(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 p-1 rounded"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">Carbon reduction benchmark goals</span>
        </div>

        {/* KPI 4: Capex Payback Progress (Editable) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payback ROI Progress</span>
            <span className="text-[9px] font-bold text-amber-500 font-mono">T3 Edit</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[8px] text-slate-400 uppercase">Payback ($)</label>
              <input 
                type="number" 
                value={annualPaybackProgress}
                onChange={(e) => setAnnualPaybackProgress(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 p-1 rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[8px] text-slate-400 uppercase">Target ($)</label>
              <input 
                type="number" 
                value={annualPaybackTarget}
                onChange={(e) => setAnnualPaybackTarget(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 p-1 rounded"
              />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all" 
              style={{ width: `${Math.min(100, (annualPaybackProgress / (annualPaybackTarget || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Connected Panel: Strategic Capex Funding Connection Board */}
      <div className="bg-[#FFC20E]/5 border border-[#FFC20E]/30 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFC20E] animate-ping"></div>
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider font-mono">
              ⚡ Connected Strategic Funding Desk
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Operator-to-Strategic Alignment</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          The list below detects **unresolved, high-priority operational deviations** from your daily huddle boards. Click **"Fund with Strategic Capex"** to allocate capital budget, resolve the deviation, and automatically convert the root cause into a Continuous Improvement (CI) project!
        </p>

        {openAlertDeviations.length === 0 ? (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 rounded-xl text-center text-xs text-slate-400 font-semibold italic">
            All active deviations have been aligned and funded by the strategic capital team!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 rounded-xl bg-white dark:bg-slate-900 overflow-hidden max-h-[180px] overflow-y-auto">
            {openAlertDeviations.map((dev) => (
              <div key={dev.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold bg-slate-950 text-white px-2 py-0.5 rounded font-mono uppercase">
                      {dev.pillar}
                    </span>
                    <span className="text-[10px] text-rose-500 font-bold font-mono">UNRESOLVED ERROR</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {dev.widgetTitle}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    <strong>Observed:</strong> {dev.description} | <strong>5-Why Cause:</strong> {dev.rootCause || 'Under review...'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFundDeviationWithCapex(dev)}
                  className="px-3.5 py-1.5 bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 font-extrabold text-[11px] rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition-all font-mono"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Fund Root Cause</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Ishikawa breakdown and Annual Budget Planner Sliders */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Monthly Budget Planner sliders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-[#FFC20E]" />
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                Epiroc Annual Budget Sliders
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Dynamically adjust capital allocation versus operational budgets. Real-time return metrics calculate below:
            </p>

            {/* Slider 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Capex Equipment Allocation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#FFC20E] text-sm">${capexAllocation}k</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="800" 
                value={capexAllocation}
                onChange={(e) => setCapexAllocation(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#FFC20E]"
              />
            </div>

            {/* Slider 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Opex Maintenance Budget:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#FFC20E] text-sm">${opexBudget}k</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="500" 
                value={opexBudget}
                onChange={(e) => setOpexBudget(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#FFC20E]"
              />
            </div>

            {/* Output Summary calculations */}
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block">Estimated ROI Returns</span>
                <span className="text-xs font-bold text-emerald-600 font-mono mt-0.5 block">
                  +${Math.round(capexAllocation * 0.32).toLocaleString()}k/yr
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block">Total Budget Allocation</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
                  ${(capexAllocation + opexBudget).toLocaleString()}k
                </span>
              </div>
            </div>
          </div>

          {/* 2. Ishikawa Vulenerability breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#FFC20E]" />
                Vulnerability Category Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Visualizing company deviations by standard Ishikawa Lean categories:
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {(['Machine', 'Method', 'Manpower', 'Material'] as const).map(cat => {
                const count = deviations.filter(d => d.ishikawaCategory === cat).length;
                const percent = totalDeviations > 0 ? (count / totalDeviations) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat} Errors</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        {count} items
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-slate-800 dark:bg-[#FFC20E]" 
                        style={{ width: `${percent || 4}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Continuous Improvement (CI) Idea Incubator */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-[525px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#FFC20E]" />
                Continuous Improvement Idea Incubator
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Operator ideas funded by strategic budget return simulations.
              </p>
            </div>
          </div>

          {/* Ideas Grid */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
            {ideas.map((idea) => (
              <div 
                key={idea.id}
                className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start justify-between gap-4 hover:border-[#FFC20E] transition-all shadow-sm"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold bg-slate-950 text-white px-2 py-0.5 rounded font-mono uppercase">
                      {idea.pillar}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">By {idea.submittedBy}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug break-words" title={idea.title}>
                    {idea.title}
                  </h4>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      Savings: ${idea.estimatedSaving.toLocaleString()}/yr
                    </span>
                    <span>·</span>
                    <span>Capex: ${idea.capitalCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Voting & Admin actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleVote(idea.id)}
                    className="flex items-center gap-1 px-2 py-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-slate-600 dark:text-slate-300 font-bold font-mono text-xs cursor-pointer transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>{idea.votes}</span>
                  </button>

                  <select
                    value={idea.status}
                    onChange={(e) => handleUpdateIdeaStatus(idea.id, e.target.value as any)}
                    className="text-[10px] font-bold font-mono px-1.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-none text-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="draft">Reviewing</option>
                    <option value="approved">Funded</option>
                    <option value="implemented">Active SOP</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Form to submit suggestion */}
          <form onSubmit={handleAddIdea} className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">CI Idea Description</label>
                <input
                  type="text"
                  required
                  placeholder="Describe waste elimination or safety action"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#FFC20E] font-bold uppercase tracking-wider mb-1">Target Pillar</label>
                <select
                  value={ideaPillar}
                  onChange={(e) => setIdeaPillar(e.target.value as Pillar)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Safety">Safety</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Quality">Quality</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Cost">Cost</option>
                  <option value="Capital">Capital</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[8px] text-slate-400 font-bold uppercase mb-1">Est. Savings</label>
                  <input
                    type="number"
                    placeholder="$/yr"
                    value={ideaSaving}
                    onChange={(e) => setIdeaSaving(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-400 font-bold uppercase mb-1">Capex cost</label>
                  <input
                    type="number"
                    placeholder="$"
                    value={ideaCost}
                    onChange={(e) => setIdeaCost(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#FFC20E] dark:hover:bg-[#E5B200] dark:text-slate-950 text-white rounded-lg text-xs font-extrabold shrink-0 cursor-pointer shadow-sm transition-colors"
            >
              Propose CI
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
