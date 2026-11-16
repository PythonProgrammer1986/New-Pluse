import React, { useState } from 'react';
import { Deviation, ActionItem, Pillar, MetricWidget } from '../types';
import {
  AlertTriangle, CheckCircle2, ChevronRight, Plus,
  HelpCircle, Trash2, Calendar, CheckSquare
} from 'lucide-react';

interface DeviationSolverProps {
  deviations: Deviation[];
  onUpdateDeviation: (id: string, updates: Partial<Deviation>) => void;
  onDeleteDeviation: (id: string) => void;
  onAddActionItem: (action: Omit<ActionItem, 'id'>) => void;
  onAddDeviation?: (deviation: Omit<Deviation, 'id' | 'isResolved'>) => void;
  actionItems: ActionItem[];
  userRole: string;
  widgets?: MetricWidget[];
  onAddMetricToWeekly?: (widgetId: string) => void;
}

export default function DeviationSolver({
  deviations,
  onUpdateDeviation,
  onDeleteDeviation,
  onAddActionItem,
  onAddDeviation,
  actionItems,
  widgets = [],
  onAddMetricToWeekly,
}: DeviationSolverProps) {
  const [selectedDevId, setSelectedDevId] = useState<string | null>(
    deviations.length > 0 ? deviations[0].id : null
  );

  const [showAddDeviation, setShowAddDeviation] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualPillar, setManualPillar] = useState<Pillar>('Safety');
  const [manualLevel, setManualLevel] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [manualDesc, setManualDesc] = useState('');
  const [manualIshikawa, setManualIshikawa] = useState<'Machine' | 'Method' | 'Manpower' | 'Material'>('Method');

  const [actionTitle, setActionTitle] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [actionPriority, setActionPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [actionNotes, setActionNotes] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);

  const [showResolved, setShowResolved] = useState(false);
  const [rigorousMode, setRigorousMode] = useState(false);

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
      const updatedWhys = [...currentWhys, 'Why? (Added root cause level)'];
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

    setActionTitle('');
    setActionOwner('');
    setActionDueDate('');
    setActionPriority('medium');
    setActionNotes('');
    setShowActionForm(false);
  };

  const handleCreateManualDeviation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDesc) return;

    if (onAddDeviation) {
      onAddDeviation({
        widgetId: `manual-dev-${Date.now()}`,
        widgetTitle: manualTitle,
        pillar: manualPillar,
        level: manualLevel,
        date: new Date().toISOString().split('T')[0],
        description: manualDesc,
        fiveWhys: [
          'Why did this operational deviation occur? (Level 1)',
          'Why? (Level 2)',
          'Why? (Level 3)',
          'Why? (Level 4)',
          'Why? (Root cause established)'
        ],
        rootCause: 'Root cause analysis pending...',
        ishikawaCategory: manualIshikawa
      });
    }

    setManualTitle('');
    setManualDesc('');
    setManualPillar('Safety');
    setManualLevel('daily');
    setManualIshikawa('Method');
    setShowAddDeviation(false);
  };

  const activeDeviations = deviations.filter(d => !d.isResolved);
  const resolvedDeviations = deviations.filter(d => d.isResolved);

  const deviatingWidgetsNotInWeekly = widgets.filter(
    (w) => w.state === 'red' && !deviations.some(d => d.widgetId === w.id && !d.isResolved)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT PANEL: Deviations List */}
      <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[540px] lg:h-[620px]">
        <div className="px-4 py-3.5 border-b border-gray-200 bg-[#F7F8F9] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#262A2E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
              Operational Deviations
            </h3>
            <span className="text-[10px] text-[#6B7280] font-mono block mt-0.5">Stand-up Deviation Desk</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-[#FFC20E] text-[#1F2328] font-bold uppercase tracking-wider font-mono">
            T2 Weekly
          </span>
        </div>

        {/* Manual Deviation Trigger Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase tracking-wider">
            Manual Logs Desk
          </span>
          <button
            type="button"
            onClick={() => setShowAddDeviation(true)}
            className="px-2.5 py-1 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-[10px] font-extrabold rounded-md flex items-center gap-1 cursor-pointer font-mono transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Log Deviation</span>
          </button>
        </div>

        {/* Available Red Metrics not yet added to Weekly */}
        {deviatingWidgetsNotInWeekly.length > 0 && (
          <div className="p-3 bg-[#FFFBEB] border-b border-[#FFC20E]/40 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-[#1F2328] uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#D97706] shrink-0" />
                <span>Metric Deviations ({deviatingWidgetsNotInWeekly.length} Ready)</span>
              </span>
            </div>
            <p className="text-[10px] text-[#4B5563] mb-2 leading-tight">
              Not yet in weekly analysis. Click Add to escalate:
            </p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {deviatingWidgetsNotInWeekly.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-gray-200 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[#262A2E] text-[11px] truncate block" title={w.title}>
                      {w.title}
                    </span>
                    <span className="text-[9px] font-mono text-[#6B7280] uppercase">
                      [{w.pillar}] {w.actual !== undefined ? `Actual: ${w.actual}` : ''}{' '}
                      {w.target !== undefined ? `/ Target: ${w.target}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddMetricToWeekly?.(w.id)}
                    className="px-2 py-0.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-[10px] font-extrabold rounded flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-wider font-mono shrink-0"
                    title={`Add "${w.title}" to Weekly Analysis`}
                  >
                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {deviations.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280]">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span className="text-xs font-semibold block text-[#262A2E]">All Metrics Operational</span>
              <span className="text-[10px] mt-1 block leading-relaxed">
                No open deviations recorded this shift.
              </span>
            </div>
          ) : (
            <>
              {activeDeviations.length > 0 && (
                <div className="px-3 py-2 bg-rose-50 border-b border-rose-100">
                  <span className="text-[9px] font-bold text-rose-700 uppercase tracking-widest font-mono">
                    Awaiting Root Cause ({activeDeviations.length})
                  </span>
                </div>
              )}
              {activeDeviations.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDevId(d.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                    selectedDevId === d.id
                      ? 'bg-[#FFFBEB] ring-1 ring-inset ring-[#FFC20E]'
                      : 'hover:bg-[#F7F8F9]'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-rose-500"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#3A3F45] text-white font-mono uppercase">
                        {d.pillar}
                      </span>
                      <span className="text-[9px] font-mono text-[#6B7280]">{d.date}</span>
                    </div>
                    <h4 className="font-bold text-[#262A2E] text-xs mt-1.5 truncate">
                      {d.widgetTitle}
                    </h4>
                    {d.ishikawaCategory && (
                      <span className="inline-block text-[9px] font-bold bg-[#F3F4F6] text-[#3A3F45] px-1.5 py-0.5 rounded font-mono mt-1 border border-gray-200 uppercase">
                        Ishikawa: {d.ishikawaCategory}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] shrink-0 self-center" />
                </button>
              ))}

              {resolvedDeviations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowResolved(!showResolved)}
                  className="w-full text-left p-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-[9px] font-bold text-emerald-700 uppercase tracking-widest font-mono cursor-pointer hover:bg-emerald-50"
                >
                  <span>Resolved Countermeasures ({resolvedDeviations.length})</span>
                  <span className="text-[10px] text-[#6B7280]">{showResolved ? 'Collapse' : 'Expand'}</span>
                </button>
              )}
              {showResolved &&
                resolvedDeviations.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDevId(d.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer opacity-75 ${
                      selectedDevId === d.id
                        ? 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-400'
                        : 'hover:bg-[#F7F8F9]'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-emerald-500"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-[#3A3F45] font-mono uppercase">
                          {d.pillar}
                        </span>
                        <span className="text-[9px] font-mono text-[#6B7280]">{d.date}</span>
                      </div>
                      <h4 className="font-semibold text-[#4B5563] text-xs mt-1 line-through truncate">
                        {d.widgetTitle}
                      </h4>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] shrink-0 self-center" />
                  </button>
                ))}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: 5-Whys & Ishikawa */}
      <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[540px] lg:h-[620px]">
        {selectedDev ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-[#F7F8F9]">
              <div className="max-w-[68%]">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFC20E] text-[#1F2328] font-mono uppercase">
                    {selectedDev.pillar}
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Logged: {selectedDev.date}
                  </span>
                </div>
                <h3 className="font-bold text-[#262A2E] text-sm mt-1 truncate" title={selectedDev.widgetTitle}>
                  {selectedDev.widgetTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateDeviation(selectedDev.id, { isResolved: !selectedDev.isResolved })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    selectedDev.isResolved
                      ? 'bg-white border border-gray-300 hover:bg-gray-100 text-[#3A3F45]'
                      : 'bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328]'
                  }`}
                >
                  {selectedDev.isResolved ? 'Reopen Deviation' : 'Resolve Deviation'}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDeviation(selectedDev.id)}
                  className="p-1.5 hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Remove Deviation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-[#F7F8F9] p-4 border border-gray-200 rounded-xl space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest block mb-1 font-mono">
                    Problem Definition
                  </span>
                  <p className="text-xs text-[#262A2E] leading-relaxed font-semibold">
                    {selectedDev.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest block mb-2 font-mono">
                    Ishikawa (4M Classification)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Machine', 'Method', 'Manpower', 'Material'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => onUpdateDeviation(selectedDev.id, { ishikawaCategory: cat })}
                        className={`py-1.5 text-[10px] font-bold font-mono uppercase border rounded-lg transition-colors cursor-pointer ${
                          selectedDev.ishikawaCategory === cat
                            ? 'bg-[#FFC20E] border-[#E5AE00] text-[#1F2328] font-extrabold'
                            : 'bg-white text-[#4B5563] border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#D97706]" />
                    <span className="text-xs font-bold text-[#262A2E]">
                      Why-Cascading Root Cause Analysis
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-[#F3F4F6] p-0.5 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setRigorousMode(false)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-colors cursor-pointer ${
                          !rigorousMode ? 'bg-[#FFC20E] text-[#1F2328]' : 'text-[#6B7280]'
                        }`}
                      >
                        Quick 3-Whys
                      </button>
                      <button
                        type="button"
                        onClick={() => setRigorousMode(true)}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-colors cursor-pointer ${
                          rigorousMode ? 'bg-[#FFC20E] text-[#1F2328]' : 'text-[#6B7280]'
                        }`}
                      >
                        Rigorous 5-Whys
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddWhyStep}
                      className="px-2 py-0.5 bg-white hover:bg-gray-50 border border-gray-300 rounded text-[10px] font-bold text-[#3A3F45] cursor-pointer"
                    >
                      + Add Why
                    </button>
                    {(selectedDev.fiveWhys || []).length > 1 && (
                      <button
                        type="button"
                        onClick={handleRemoveWhyStep}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 rounded text-[10px] font-bold text-rose-700 cursor-pointer"
                      >
                        - Remove
                      </button>
                    )}
                  </div>
                </div>

                {selectedDev.fiveWhys &&
                  (rigorousMode ? selectedDev.fiveWhys : selectedDev.fiveWhys.slice(0, 3)).map((why, index, arr) => (
                    <div key={index} className="flex items-start gap-3 relative group">
                      {index < arr.length - 1 && (
                        <div className="absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] bg-gray-200 group-hover:bg-[#FFC20E] transition-colors"></div>
                      )}

                      <div className="w-7 h-7 rounded-full bg-[#F7F8F9] border border-gray-300 flex items-center justify-center text-[10px] font-bold text-[#262A2E] shrink-0 font-mono">
                        W{index + 1}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          value={why}
                          onChange={(e) => handleWhyChange(index, e.target.value)}
                          placeholder="Why did the previous step occur?"
                          className="w-full text-xs font-medium px-3 py-2 bg-white border border-gray-300 text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-3 border-t border-gray-200">
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1.5 font-mono">
                  Final Root Cause Statement
                </label>
                <textarea
                  value={selectedDev.rootCause || ''}
                  onChange={(e) => onUpdateDeviation(selectedDev.id, { rootCause: e.target.value })}
                  placeholder="Summarize the systemic root cause..."
                  rows={2}
                  className="w-full text-xs font-medium p-3 border border-gray-300 bg-white text-[#262A2E] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                />
              </div>

              <div className="bg-[#F7F8F9] p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#D97706]" />
                    <span className="text-xs font-bold text-[#262A2E]">
                      Stand-up Countermeasure Assignment
                    </span>
                  </div>
                  {!showActionForm && !selectedDev.actionItemId && (
                    <button
                      type="button"
                      onClick={() => setShowActionForm(true)}
                      className="px-2.5 py-1 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] rounded-md text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Assign Action
                    </button>
                  )}
                </div>

                {selectedDev.actionItemId ? (
                  (() => {
                    const linkedAction = actionItems.find((a) => a.id === selectedDev.actionItemId);
                    if (!linkedAction) return null;
                    return (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-bold text-[#D97706] uppercase tracking-widest font-mono">
                            Linked Countermeasure
                          </span>
                          <h4 className="text-xs font-bold text-[#262A2E] mt-0.5">{linkedAction.title}</h4>
                          <div className="flex items-center gap-3 text-[10px] text-[#6B7280] mt-2 font-mono">
                            <span>Owner: {linkedAction.owner}</span>
                            <span>·</span>
                            <span>Due: {linkedAction.dueDate}</span>
                            <span>·</span>
                            <span className="capitalize">{linkedAction.priority} priority</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-[#FFFBEB] text-[#1F2328] border border-[#FFC20E]/50">
                          {linkedAction.status}
                        </span>
                      </div>
                    );
                  })()
                ) : showActionForm ? (
                  <form
                    onSubmit={handleCreateAction}
                    className="space-y-3 bg-white p-4 rounded-xl border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                          Action Item / Countermeasure
                        </label>
                        <input
                          type="text"
                          required
                          value={actionTitle}
                          onChange={(e) => setActionTitle(e.target.value)}
                          placeholder="e.g. Clean floor and replace guide Teflon pad"
                          className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                          Assignee (Owner)
                        </label>
                        <input
                          type="text"
                          required
                          value={actionOwner}
                          onChange={(e) => setActionOwner(e.target.value)}
                          placeholder="e.g. Dave Miller"
                          className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={actionDueDate}
                          onChange={(e) => setActionDueDate(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                          Priority Level
                        </label>
                        <select
                          value={actionPriority}
                          onChange={(e) => setActionPriority(e.target.value as any)}
                          className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
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
                        className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-gray-100 rounded-md font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-md cursor-pointer"
                      >
                        Assign Task
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    No active countermeasure is linked. Create an action item to track remediation on the Action Plan.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#6B7280]">
            <HelpCircle className="w-10 h-10 text-gray-300 mb-2" />
            <span className="text-sm font-semibold block text-[#262A2E]">No Deviation Selected</span>
            <span className="text-xs mt-1 block max-w-xs leading-relaxed">
              Select a deviation on the left to open the 5-Whys root cause solver and assign action items.
            </span>
          </div>
        )}
      </div>

      {/* MANUAL DEVIATION MODAL */}
      {showAddDeviation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-[#F7F8F9] border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-[#262A2E]">Log Operational Deviation</h3>
                  <span className="text-[10px] text-[#6B7280] font-mono">Shift standing exception log</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeviation(false)}
                className="text-[#6B7280] hover:text-[#262A2E] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateManualDeviation} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Deviation Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic valve leakage, Solder jig temperature drop"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold text-[#262A2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Pillar Focus
                  </label>
                  <select
                    value={manualPillar}
                    onChange={(e) => setManualPillar(e.target.value as Pillar)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold text-[#262A2E]"
                  >
                    <option value="Safety">Safety</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Quality">Quality</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Cost">Cost</option>
                    <option value="Capital">Capital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Huddle Level
                  </label>
                  <select
                    value={manualLevel}
                    onChange={(e) => setManualLevel(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold text-[#262A2E]"
                  >
                    <option value="daily">Daily Pulse</option>
                    <option value="weekly">Weekly Standup</option>
                    <option value="monthly">Monthly Strategic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Ishikawa Class
                  </label>
                  <select
                    value={manualIshikawa}
                    onChange={(e) => setManualIshikawa(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold text-[#262A2E]"
                  >
                    <option value="Machine">Machine</option>
                    <option value="Method">Method</option>
                    <option value="Manpower">Manpower</option>
                    <option value="Material">Material</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Incident Observation
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what happened, where, and who observed it."
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium text-[#262A2E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddDeviation(false)}
                  className="px-4 py-2 text-xs text-[#4B5563] hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-lg cursor-pointer font-mono flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Deviation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
