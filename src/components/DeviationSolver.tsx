import React, { useState } from 'react';
import { Deviation, ActionItem, Pillar } from '../types';
import { 
  AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Play, Plus, 
  HelpCircle, Trash2, Calendar, Shield, Leaf, CheckSquare, TrendingUp, Coins, HardHat,
  GitCommit, Hammer, ClipboardList, Layers, Star
} from 'lucide-react';

interface DeviationSolverProps {
  deviations: Deviation[];
  onUpdateDeviation: (id: string, updates: Partial<Deviation>) => void;
  onDeleteDeviation: (id: string) => void;
  onAddActionItem: (action: Omit<ActionItem, 'id'>) => void;
  actionItems: ActionItem[];
  userRole: string;
}

export default function DeviationSolver({
  deviations,
  onUpdateDeviation,
  onDeleteDeviation,
  onAddActionItem,
  actionItems,
  userRole,
}: DeviationSolverProps) {
  const [selectedDevId, setSelectedDevId] = useState<string | null>(
    deviations.length > 0 ? deviations[0].id : null
  );

  // Form for adding Action Item
  const [actionTitle, setActionTitle] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [actionPriority, setActionPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [actionNotes, setActionNotes] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);

  // If there's no selected deviation but deviations exist, set the first one
  React.useEffect(() => {
    if (deviations.length > 0 && (!selectedDevId || !deviations.some(d => d.id === selectedDevId))) {
      setSelectedDevId(deviations[0].id);
    }
  }, [deviations, selectedDevId]);

  const selectedDev = deviations.find((d) => d.id === selectedDevId);

  const handleWhyChange = (index: number, val: string) => {
    if (selectedDev && selectedDev.fiveWhys) {
      const updatedWhys = [...selectedDev.fiveWhys];
      updatedWhys[index] = val;
      onUpdateDeviation(selectedDev.id, { fiveWhys: updatedWhys });
    }
  };

  const handleAddWhyStep = () => {
    if (selectedDev) {
      const currentWhys = selectedDev.fiveWhys || [];
      const updatedWhys = [...currentWhys, 'Why? (Added customized root cause level)'];
      onUpdateDeviation(selectedDev.id, { fiveWhys: updatedWhys });
    }
  };

  const handleRemoveWhyStep = () => {
    if (selectedDev && selectedDev.fiveWhys && selectedDev.fiveWhys.length > 1) {
      const updatedWhys = selectedDev.fiveWhys.slice(0, -1);
      onUpdateDeviation(selectedDev.id, { fiveWhys: updatedWhys });
    }
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDev || !actionTitle || !actionOwner) return;

    onAddActionItem({
      pillar: selectedDev.pillar,
      title: actionTitle,
      owner: actionOwner,
      dueDate: actionDueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: actionPriority,
      status: 'open',
      deviationId: selectedDev.id,
      notes: actionNotes
    });

    // Reset action form
    setActionTitle('');
    setActionOwner('');
    setActionDueDate('');
    setActionPriority('medium');
    setActionNotes('');
    setShowActionForm(false);
  };

  const activeDeviations = deviations.filter(d => !d.isResolved);
  const resolvedDeviations = deviations.filter(d => d.isResolved);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT PANEL: Deviations List (Epiroc Dark Slate & White layout) */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[610px]">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-950 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFC20E] shrink-0" />
              Operational Deviations
            </h3>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">Stand-up Deviation Desk</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-[#FFC20E] text-slate-900 font-bold uppercase tracking-wider font-mono">
            T2 Weekly
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {deviations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-[#FFC20E] mx-auto mb-2" />
              <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">All Metrics Operational</span>
              <span className="text-[10px] mt-1 block leading-relaxed">No open deviations recorded this shift.</span>
            </div>
          ) : (
            <>
              {/* Active Section */}
              {activeDeviations.length > 0 && (
                <div className="p-2 bg-rose-50/20 dark:bg-rose-950/10 border-b border-rose-100/50">
                  <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 px-2 uppercase tracking-widest font-mono">
                    Awaiting Root Cause ({activeDeviations.length})
                  </span>
                </div>
              )}
              {activeDeviations.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDevId(d.id)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                    selectedDevId === d.id 
                      ? 'bg-amber-50/20 dark:bg-slate-800 border-l-4 border-l-[#FFC20E]' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-rose-500 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-950 text-white font-mono uppercase">
                        {d.pillar}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{d.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-1.5 truncate">
                      {d.widgetTitle}
                    </h4>
                    {d.ishikawaCategory && (
                      <span className="inline-block text-[9px] font-bold bg-[#FFC20E]/10 text-slate-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono mt-1 border border-[#FFC20E]/20 uppercase">
                        Ishikawa: {d.ishikawaCategory}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 self-center" />
                </button>
              ))}

              {/* Resolved Section */}
              {resolvedDeviations.length > 0 && (
                <div className="p-2 bg-emerald-50/20 dark:bg-emerald-950/10 border-b border-emerald-100/50">
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 px-2 uppercase tracking-widest font-mono">
                    Resolved Countermeasures ({resolvedDeviations.length})
                  </span>
                </div>
              )}
              {resolvedDeviations.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDevId(d.id)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer opacity-70 ${
                    selectedDevId === d.id 
                      ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-emerald-500' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-emerald-500"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-850 dark:text-slate-300 font-mono uppercase">
                        {d.pillar}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{d.date}</span>
                    </div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-xs mt-1 line-through truncate">
                      {d.widgetTitle}
                    </h4>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 self-center" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Highly Editable 5-Whys & 4M Ishikawa Categorizer */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[610px]">
        {selectedDev ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header with Epiroc Dark slate styling */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <div className="max-w-[70%]">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFC20E] text-slate-900 font-mono uppercase">
                    {selectedDev.pillar}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Logged: {selectedDev.date}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-sm mt-1 truncate" title={selectedDev.widgetTitle}>
                  {selectedDev.widgetTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateDeviation(selectedDev.id, { isResolved: !selectedDev.isResolved })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm ${
                    selectedDev.isResolved 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950'
                  }`}
                >
                  {selectedDev.isResolved ? 'Reopen Deviation' : 'Resolve Deviation'}
                </button>
                <button
                  onClick={() => onDeleteDeviation(selectedDev.id)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  title="Remove Deviation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Solver Area scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Problem Description and Lean 4M Ishikawa Classification */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                    Problem Definition
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    {selectedDev.description}
                  </p>
                </div>

                {/* 4M Ishikawa Selector (Request #3 - more editable options) */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono">
                    Ishikawa (4M Classification)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Machine', 'Method', 'Manpower', 'Material'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => onUpdateDeviation(selectedDev.id, { ishikawaCategory: cat })}
                        className={`py-1.5 text-[10px] font-bold font-mono uppercase border rounded-lg transition-all cursor-pointer ${
                          selectedDev.ishikawaCategory === cat
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-[#FFC20E] dark:border-[#FFC20E] dark:text-slate-950 scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable 5-Whys Cascading Board with Custom Why increments */}
              <div className="space-y-3.5 relative">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#FFC20E]" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      5-Whys Cascading Root Cause
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddWhyStep}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      title="Append additional Cause Analysis block"
                    >
                      + Add Why
                    </button>
                    {(selectedDev.fiveWhys || []).length > 1 && (
                      <button
                        type="button"
                        onClick={handleRemoveWhyStep}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 rounded text-[10px] font-bold text-rose-600 cursor-pointer"
                      >
                        - Remove last
                      </button>
                    )}
                  </div>
                </div>

                {/* 5-Whys Stack */}
                {selectedDev.fiveWhys && selectedDev.fiveWhys.map((why, index) => (
                  <div key={index} className="flex items-start gap-3 relative group">
                    {/* Visual Connector Line */}
                    {index < (selectedDev.fiveWhys!.length - 1) && (
                      <div className="absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-800 group-hover:bg-[#FFC20E] transition-colors"></div>
                    )}
                    
                    {/* Level Badge */}
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0 font-mono shadow-sm">
                      W{index + 1}
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={why}
                        onChange={(e) => handleWhyChange(index, e.target.value)}
                        placeholder={`Why did the previous step occur?`}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:border-[#FFC20E] focus:ring-1 focus:ring-[#FFC20E] transition-all shadow-inner"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Concluded Root Cause Summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                  Final Root Cause Statement
                </label>
                <textarea
                  value={selectedDev.rootCause || ''}
                  onChange={(e) => onUpdateDeviation(selectedDev.id, { rootCause: e.target.value })}
                  placeholder="Draft final systemic root cause to sync with Monthly Strategic Continuous Improvement budget."
                  rows={2}
                  className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-[#FFC20E] focus:ring-1 focus:ring-[#FFC20E] shadow-inner"
                />
              </div>

              {/* Actions & Countermeasures Section */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200 dark:border-slate-800 rounded-xl mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#FFC20E]" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Stand-up Countermeasure Assignment
                    </span>
                  </div>
                  {!showActionForm && !selectedDev.actionItemId && (
                    <button
                      onClick={() => setShowActionForm(true)}
                      className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#FFC20E] dark:hover:bg-[#E5B200] dark:text-slate-950 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Assign Action
                    </button>
                  )}
                </div>

                {selectedDev.actionItemId ? (
                  (() => {
                    const linkedAction = actionItems.find(a => a.id === selectedDev.actionItemId);
                    if (!linkedAction) return null;
                    return (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest font-mono">
                            Linked Task
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {linkedAction.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2 font-mono">
                            <span>Owner: {linkedAction.owner}</span>
                            <span>·</span>
                            <span>Due: {linkedAction.dueDate}</span>
                            <span>·</span>
                            <span className="capitalize">{linkedAction.priority} priority</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-indigo-50 text-indigo-700">
                          {linkedAction.status}
                        </span>
                      </div>
                    );
                  })()
                ) : showActionForm ? (
                  <form onSubmit={handleCreateAction} className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-semibold uppercase">Action Item / Countermeasure</label>
                        <input
                          type="text"
                          required
                          value={actionTitle}
                          onChange={(e) => setActionTitle(e.target.value)}
                          placeholder="e.g. Clean floor and replace guide Teflon pad"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold uppercase">Assignee (Owner)</label>
                        <input
                          type="text"
                          required
                          value={actionOwner}
                          onChange={(e) => setActionOwner(e.target.value)}
                          placeholder="e.g. Dave Miller"
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold uppercase">Due Date</label>
                        <input
                          type="date"
                          value={actionDueDate}
                          onChange={(e) => setActionDueDate(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold uppercase">Priority Level</label>
                        <select
                          value={actionPriority}
                          onChange={(e) => setActionPriority(e.target.value as any)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowActionForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-md font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#FFC20E] text-slate-950 text-xs font-bold rounded-md"
                      >
                        Assign Task
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    No active countermeasure is currently linked. Create an action item to trace remediation progress directly on the standup boards.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
            <span className="text-sm font-semibold block text-slate-800 dark:text-slate-200">No Deviation Selected</span>
            <span className="text-xs mt-1 block max-w-xs leading-relaxed">
              Select an operational deviation from the stand-up panel on the left to initiate 5-Whys root cause solver and log action items.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
