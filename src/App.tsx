/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from './useAppState';
import { Pillar, PulseLevel, MetricWidget } from './types';
import { TEAMS_LIST, ROLES_LIST } from './seedData';
import SafetyCrossCalendar from './components/SafetyCrossCalendar';
import WidgetCard from './components/WidgetCard';
import DeviationSolver from './components/DeviationSolver';
import ActionPlanTable from './components/ActionPlanTable';
import StrategicDashboard from './components/StrategicDashboard';
import BackupPanel from './components/BackupPanel';
import { 
  Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat,
  Users, Activity, Calendar, Award, RefreshCw, AlertTriangle,
  Plus, Check, ChevronRight, Filter, LogOut, Sparkles, BookOpen,
  ArrowRight, Landmark
} from 'lucide-react';

export default function App() {
  const {
    state,
    setTeam,
    setRole,
    updateWidgetValue,
    toggleChecklistItem,
    updateSafetyCross,
    updateSafetyNote,
    addWidget,
    deleteWidget,
    addDeviation,
    updateDeviation,
    deleteDeviation,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    exportBackup,
    importBackup,
    resetToTemplate,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot
  } = useAppState();

  const [activeLevel, setActiveLevel] = useState<PulseLevel>('daily');
  const [activeTab, setActiveTab] = useState<'board' | 'actions' | 'backup'>('board');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  
  // Custom widget creation form state
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newWTitle, setNewWTitle] = useState('');
  const [newWPillar, setNewWPillar] = useState<Pillar>('Quality');
  const [newWLevel, setNewWLevel] = useState<PulseLevel>('daily');
  const [newWType, setNewWType] = useState<
    'numeric' | 'checklist' | 'gauge' | 'counter' | 'chart' | 'project' |
    'stopwatch' | 'heatmap' | 'pareto' | 'skills' | 'kanban' | 'handover' |
    'riskGauge' | 'emission' | 'radar' | 'countdown' | 'pulse'
  >('numeric');
  const [newWUnit, setNewWUnit] = useState('');
  const [newWTarget, setNewWTarget] = useState('');
  const [newWActual, setNewWActual] = useState('');
  const [newWDesc, setNewWDesc] = useState('');
  const [newWWarningThreshold, setNewWWarningThreshold] = useState<string>('110');
  
  // Custom interface list items parsing (checklists, charts, projects)
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChartText, setNewChartText] = useState('');
  const [newProjectText, setNewProjectText] = useState('');

  // Archive snapshot selection states
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string>('live');
  const [snapshotTargetDate, setSnapshotTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Dynamically pull from historical backup snapshot if viewing an archive
  const activeSnapshot = selectedSnapshotDate !== 'live' && state.history ? state.history[selectedSnapshotDate] : null;

  const currentWidgets = activeSnapshot ? activeSnapshot.widgets : state.widgets;
  const currentDeviations = activeSnapshot ? activeSnapshot.deviations : state.deviations;
  const currentActionItems = activeSnapshot ? activeSnapshot.actionItems : state.actionItems;
  const currentSafetyCross = activeSnapshot ? activeSnapshot.safetyCross : state.safetyCross;
  const currentSafetyNotes = activeSnapshot ? activeSnapshot.safetyNotes : (state.safetyNotes || {});

  // Filter widgets by active level and pillar
  const displayedWidgets = currentWidgets.filter((w) => {
    const matchesLevel = w.level === activeLevel;
    const matchesPillar = selectedPillarFilter === 'all' || w.pillar === selectedPillarFilter;
    return matchesLevel && matchesPillar;
  });

  const handleAddCustomWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWTitle) return;

    let checklistData = undefined;
    if (newWType === 'checklist') {
      const items = newChecklistText ? newChecklistText.split(',') : [];
      checklistData = items.length > 0
        ? items.map((it, idx) => ({ id: `chk-${idx}-${Date.now()}`, label: it.trim(), checked: false }))
        : [
            { id: 'c-1', label: 'Verify equipment compliance checks', checked: false },
            { id: 'c-2', label: 'Perform standard 5S workspace sweep', checked: false }
          ];
    }

    let chartData = undefined;
    if (newWType === 'chart') {
      const categories = newChartText ? newChartText.split(',') : [];
      chartData = categories.length > 0
        ? categories.map((cat) => ({ label: cat.trim(), value: 0, target: 1 }))
        : [
            { label: 'Surface Scratches', value: 0, target: 1 },
            { label: 'Dimensional Deviations', value: 0, target: 1 }
          ];
    }

    let milestonesData = undefined;
    if (newWType === 'project') {
      const ms = newProjectText ? newProjectText.split(',') : [];
      milestonesData = ms.length > 0
        ? ms.map((m, idx) => ({ id: `ms-${idx}-${Date.now()}`, name: m.trim(), status: 'pending' as const, owner: 'Team Lead', dueDate: new Date().toISOString().split('T')[0] }))
        : [
            { id: 'm-1', name: 'Draft Design and Engineering Plan', status: 'pending' as const, owner: 'Team Lead', dueDate: new Date().toISOString().split('T')[0] },
            { id: 'm-2', name: 'Tooling installation & dry run', status: 'pending' as const, owner: 'Maintenance', dueDate: new Date().toISOString().split('T')[0] }
          ];
    }

    // Default values
    const targetVal = newWTarget ? parseFloat(newWTarget) : (newWType === 'gauge' ? 100 : undefined);
    const actualVal = newWActual ? parseFloat(newWActual) : (newWType === 'gauge' ? 0 : undefined);
    const numericValue = newWType === 'counter' ? (parseFloat(newWActual) || 0) : undefined;
    const warningThresholdVal = newWWarningThreshold ? parseFloat(newWWarningThreshold) : undefined;

    addWidget({
      title: newWTitle,
      pillar: newWPillar,
      level: newWLevel,
      type: newWType,
      unit: newWUnit || undefined,
      target: targetVal,
      actual: actualVal,
      value: numericValue,
      warningThreshold: warningThresholdVal,
      checklist: checklistData,
      dataPoints: chartData,
      milestones: milestonesData,
      description: newWDesc || `Custom tracker for ${newWTitle}.`
    });

    // Reset Widget Form
    setNewWTitle('');
    setNewWUnit('');
    setNewWTarget('');
    setNewWActual('');
    setNewWDesc('');
    setNewWWarningThreshold('110');
    setNewChecklistText('');
    setNewChartText('');
    setNewProjectText('');
    setShowAddWidget(false);
  };

  // Color mappings for active pillars
  const getPillarIcon = (p: Pillar) => {
    switch (p) {
      case 'Safety': return Shield;
      case 'Sustainability': return Leaf;
      case 'Quality': return CheckCircle;
      case 'Delivery': return TrendingUp;
      case 'Cost': return Coins;
      case 'Capital': return HardHat;
    }
  };

  const unresolvedDeviationsCount = state.deviations.filter(d => !d.isResolved).length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">

      {/* Top Bar Navigation Contract: [Brand title] — [Nav links] — [Primary Actions] */}
      {/* OVERHAULED: Epiroc Dark Slate & Yellow brand integration (Request #1) */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-40 shadow-md text-white shrink-0">
        
        {/* Brand Zone: EPIROC Lean Pulse */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-8 h-8 rounded-lg bg-[#FFC20E] flex items-center justify-center text-slate-950 font-black shadow-md">
            <span>E</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              Epiroc <span className="text-[#FFC20E] font-normal text-xs lowercase font-mono">Pulse</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-bold block leading-none font-mono tracking-widest uppercase">
              Lean Operational Board
            </span>
          </div>
        </div>

        {/* Navigation / Level Selector Contract (Epiroc Yellow highlighted active tabs) */}
        <nav className="flex flex-wrap items-center gap-1 p-1 bg-slate-850 rounded-lg border border-slate-800">
          {(['daily', 'weekly', 'monthly'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setActiveLevel(lvl);
                setActiveTab('board');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                activeLevel === lvl && activeTab === 'board'
                  ? 'bg-[#FFC20E] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl === 'daily' ? 'Daily' : lvl === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'actions'
                ? 'bg-[#FFC20E] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Actions Register
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'backup'
                ? 'bg-[#FFC20E] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Backups Facility
          </button>
        </nav>

        {/* Workspace Quick Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="hidden lg:flex flex-col text-right font-mono text-[9px] text-slate-400">
            <span>Shift: Day Huddle</span>
            <span>Ref: 2026-10-02</span>
          </div>
        </div>
      </header>

      {/* Connected Feature: Huddle Deviation Connection Engine Ribbon (Request #2) */}
      {activeTab === 'board' && activeLevel === 'daily' && unresolvedDeviationsCount > 0 && (
        <div 
          onClick={() => {
            setActiveLevel('weekly');
            setActiveTab('board');
          }}
          className="bg-amber-400 hover:bg-[#FFC20E] text-slate-950 text-xs font-extrabold px-6 py-2.5 flex items-center justify-between cursor-pointer border-b border-[#FFC20E]/50 shrink-0 transition-all select-none shadow-inner"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0 animate-bounce" />
            <span>EPIROC CORE CONNECTION: {unresolvedDeviationsCount} unresolved daily deviations detected! Click here to automatically navigate to the Weekly Solver and run 5-Whys.</span>
          </div>
          <span className="underline uppercase text-[10px] font-black shrink-0 tracking-wider">Analyze Root Causes &rarr;</span>
        </div>
      )}

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR: Operational Context Selector */}
        {/* OVERHAULED: Epiroc Premium Dark Slate Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-5 space-y-6 shrink-0 overflow-y-auto text-white">
          
          {/* Connected Team Sim (Live visual indicator metadata - clean unboxed) */}
          <div className="border-t border-slate-800 pt-4 flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC20E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFC20E]"></span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              <span>Huddle Stand-up Connected</span>
              <span className="block text-[10px] text-slate-500 font-mono mt-0.5">4 operators active on floor</span>
            </div>
          </div>

          {/* Core Lean Pillars Quick filters (only on Board tabs) */}
          {activeTab === 'board' && (
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                SSQDCC Pillar Filters
              </label>
              
              <button
                onClick={() => setSelectedPillarFilter('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedPillarFilter === 'all' 
                    ? 'bg-[#FFC20E] text-slate-950' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>All Core Pillars</span>
                <span className="font-mono text-[10px] font-bold">
                  {state.widgets.filter(w => w.level === activeLevel).length}
                </span>
              </button>

              {(['Safety', 'Sustainability', 'Quality', 'Delivery', 'Cost', 'Capital'] as Pillar[]).map((p) => {
                const count = state.widgets.filter(w => w.level === activeLevel && w.pillar === p).length;
                const PillarIcon = getPillarIcon(p);
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPillarFilter(p)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      selectedPillarFilter === p 
                        ? 'bg-slate-800 text-[#FFC20E] border-l-2 border-l-[#FFC20E]' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PillarIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{p}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </aside>

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-950">
          
          {/* Dashboard Context Title block */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
                <span>EPIROC GLOBAL OPERATIONS</span>
                <ChevronRight className="w-3 h-3" />
                <span className="capitalize">{activeTab === 'board' ? `${activeLevel} level pulse` : activeTab === 'actions' ? 'Countermeasures register' : 'Backups center'}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                {activeTab === 'board' && activeLevel === 'daily' && 'Daily Stand-up Huddleboard'}
                {activeTab === 'board' && activeLevel === 'weekly' && 'Weekly Deviations Stand-up'}
                {activeTab === 'board' && activeLevel === 'monthly' && 'Monthly Strategic Performance Board'}
                {activeTab === 'actions' && 'Action Plan & Countermeasure Registry'}
                {activeTab === 'backup' && 'Applet Backup and Restore Facility'}
              </h2>
            </div>

            {/* Historical Snapshot Selector & Config Actions Panel */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex flex-wrap items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl shadow-inner shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Snapshot Date:</span>
                </div>
                <select
                  value={selectedSnapshotDate}
                  onChange={(e) => setSelectedSnapshotDate(e.target.value)}
                  className="text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none"
                >
                  <option value="live">🟢 Live Board (Active Realtime State)</option>
                  {state.history && Object.keys(state.history).sort().reverse().map((dateStr) => (
                    <option key={dateStr} value={dateStr}>
                      📅 {dateStr} (Historical Backup)
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-250 dark:border-slate-800">
                  <input
                    type="date"
                    value={snapshotTargetDate}
                    onChange={(e) => setSnapshotTargetDate(e.target.value)}
                    className="text-[11px] font-mono px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!snapshotTargetDate) {
                        alert('Please select a date.');
                        return;
                      }
                      saveSnapshot(snapshotTargetDate);
                      setSelectedSnapshotDate(snapshotTargetDate);
                      alert(`Successfully saved backup snapshot for: ${snapshotTargetDate}!`);
                    }}
                    className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-white hover:text-[#FFC20E] text-[9px] font-black rounded-lg cursor-pointer transition-all uppercase tracking-wider"
                    title="Capture current board state and commit to historical backup registry"
                  >
                    Backup Current
                  </button>
                </div>
              </div>

              {activeTab === 'board' && activeLevel !== 'monthly' && (
                <button
                  onClick={() => setShowAddWidget(!showAddWidget)}
                  className="px-4 py-2.5 bg-[#FFC20E] hover:bg-[#F3AF00] text-slate-950 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#FFC20E]/25 hover:shadow-[#FFC20E]/40 transition-all hover:scale-[1.02] cursor-pointer uppercase tracking-wider w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" /> Add Custom Metric
                </button>
              )}
            </div>
          </div>

          {/* Historical View-Only Archive Mode Banner */}
          {selectedSnapshotDate !== 'live' && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 block">
                    Viewing Historical Backup Archive: {selectedSnapshotDate}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                    You are exploring a preserved huddleboard snapshot from <strong>{selectedSnapshotDate}</strong>. All actions, metrics, and safety calendar items are currently shown in <strong>Read-Only mode</strong> to safeguard archival logs. You can restore this archive state to the active live board or delete it anytime.
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to overwrite today's active live board with this historical backup from ${selectedSnapshotDate}? Current un-snapshotted active changes will be replaced.`)) {
                      restoreSnapshot(selectedSnapshotDate);
                      setSelectedSnapshotDate('live');
                      alert(`Successfully restored the huddleboard back to the state of ${selectedSnapshotDate}!`);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#FFC20E] text-slate-950 hover:bg-[#E5B200] text-xs font-extrabold rounded-lg shadow cursor-pointer transition-all"
                >
                  Restore to Live Board
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete this snapshot for ${selectedSnapshotDate} from the backup storage?`)) {
                      deleteSnapshot(selectedSnapshotDate);
                      setSelectedSnapshotDate('live');
                      alert(`Deleted snapshot for ${selectedSnapshotDate}.`);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Delete Snapshot
                </button>
                <button
                  onClick={() => setSelectedSnapshotDate('live')}
                  className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Exit Archive
                </button>
              </div>
            </div>
          )}

          {/* Add Widget Overlay Form */}
          {showAddWidget && (
            <form onSubmit={handleAddCustomWidget} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase">Add Custom KPI Tracker</h4>
                <button 
                  type="button" 
                  onClick={() => setShowAddWidget(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">KPI Title</label>
                  <input
                    type="text"
                    required
                    value={newWTitle}
                    onChange={(e) => setNewWTitle(e.target.value)}
                    placeholder="e.g. Daily Air Recirculation Rate"
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">SSQDCC Pillar</label>
                  <select
                    value={newWPillar}
                    onChange={(e) => setNewWPillar(e.target.value as Pillar)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
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
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pulse Level (Tier)</label>
                  <select
                    value={newWLevel}
                    onChange={(e) => setNewWLevel(e.target.value as PulseLevel)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="daily">Daily stand-up</option>
                    <option value="weekly">Weekly stand-up</option>
                    <option value="monthly">Monthly strategic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Widget Interface Style</label>
                  <select
                    value={newWType}
                    onChange={(e) => setNewWType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="numeric">1. Target vs Actual (Numeric KPI)</option>
                    <option value="checklist">2. Action Checklist (Task Audits)</option>
                    <option value="gauge">3. Circular Gauge (Percentage Dial)</option>
                    <option value="counter">4. Days Counter (Consecutive Tracker)</option>
                    <option value="chart">5. Pareto Bar Chart (Categorized Quantities)</option>
                    <option value="project">6. Milestone Project (Roadmaps & Timelines)</option>
                    <option value="stopwatch">7. Stopwatch & Timer (Work Cycle Clock)</option>
                    <option value="heatmap">8. Activity Heatmap Grid (Hourly State Matrix)</option>
                    <option value="skills">9. Competency Skill Matrix (Team Training Grid)</option>
                    <option value="kanban">10. Suggestions Kanban (Idea Incubator Cards)</option>
                    <option value="handover">11. Shift Handover Block (Supervisor Transition Sign-off)</option>
                    <option value="radar">12. Audit Radar Scorecard (5S Walkabout Radians)</option>
                    <option value="pareto">13. Scrap & Waste Pareto Bar Chart (Static Percentage Distribution)</option>
                    <option value="riskGauge">14. Hazard Alert Level Gauge (LOTO Risk Index)</option>
                    <option value="emission">15. CO₂ Emission Sparkline (Carbon Footprint Trace)</option>
                    <option value="countdown">16. Lead Time Countdown Tracker (Rig Shipping Pipeline)</option>
                    <option value="pulse">17. Takt-Time Pace Pulse (Active Takt Pace Indicator)</option>
                  </select>
                </div>

                {/* Conditionally Render Inputs based on exact requirements of Selected Style */}
                {['numeric', 'gauge', 'stopwatch', 'riskGauge', 'emission', 'pulse'].includes(newWType) && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Unit Symbol</label>
                      <input
                        type="text"
                        placeholder="e.g. % or kg or s"
                        value={newWUnit}
                        onChange={(e) => setNewWUnit(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Target Limit</label>
                      <input
                        type="number"
                        placeholder="e.g. 95"
                        value={newWTarget}
                        onChange={(e) => setNewWTarget(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Initial Value / Actual</label>
                      <input
                        type="number"
                        placeholder="e.g. 94"
                        value={newWActual}
                        onChange={(e) => setNewWActual(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Warning Threshold (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 110"
                        value={newWWarningThreshold}
                        onChange={(e) => setNewWWarningThreshold(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-mono font-semibold"
                        title="If Actual exceeds this percentage of Target, a pulsing red glow is shown."
                      />
                    </div>
                  </>
                )}

                {newWType === 'counter' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Initial Counter Value</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={newWActual}
                      onChange={(e) => setNewWActual(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-mono font-semibold"
                    />
                  </div>
                )}

                {newWType === 'checklist' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Checklist Steps (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Clean work surface, Inspect hydraulic lines, Check emergency stops"
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-semibold"
                    />
                  </div>
                )}
                {newWType === 'chart' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pareto Defect Categories (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Surface Scratches, Dimension Fail, Solder Blister, Seal Leak"
                      value={newChartText}
                      onChange={(e) => setNewChartText(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-semibold"
                    />
                  </div>
                )}
                {newWType === 'project' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Roadmap Milestones (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Design Spec Approval, Supplier Sourcing, Machine Calibration, Live Run"
                      value={newProjectText}
                      onChange={(e) => setNewProjectText(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-semibold"
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">KPI Description & Purpose</label>
                  <input
                    type="text"
                    placeholder="Why are we tracking this? (Visible on Hover)"
                    value={newWDesc}
                    onChange={(e) => setNewWDesc(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddWidget(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#FFC20E] text-slate-950 hover:bg-[#E5B200] text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Deploy Widget
                </button>
              </div>
            </form>
          )}

          {/* ACTIVE WORKSPACE RENDER PANEL */}
          {activeTab === 'board' && (
            <>
              {/* 1. DAILY PULSE LEVEL VIEWPORT */}
              {activeLevel === 'daily' && (
                <div className="space-y-6">
                  {/* Daily Pulse Operational Context Summary */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-[#FFC20E] font-mono font-bold text-sm border border-[#FFC20E]/20">
                        S1
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Daily Shift Standing Status</span>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                          Epiroc shift huddle commenced at 08:00. Safety cross, daily throughput and scrap metrics verified.
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
                      <span>PPE Audits: <span className="text-emerald-600 font-bold">100% Passed</span></span>
                      <span>·</span>
                      <span>Quality Pareto: <span className="text-rose-500 font-bold">1 Alert</span></span>
                    </div>
                  </div>

                  {/* Primary Daily Grid: Conditional structure based on Pillar Filtering */}
                  {selectedPillarFilter !== 'all' ? (
                    <div className="space-y-6">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">
                        Filtering active: Showing {selectedPillarFilter} operational pulse cards
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {/* Always display the Safety Cross Calendar if Safety pillar is active for maximum context */}
                        {selectedPillarFilter === 'Safety' && (
                          <SafetyCrossCalendar 
                            safetyCross={currentSafetyCross}
                            safetyNotes={currentSafetyNotes}
                            onDayClick={updateSafetyCross}
                            onUpdateNote={updateSafetyNote}
                            daysSinceLastLTI={
                              currentWidgets.find((w) => w.id === 'd-safety-lti')?.value || 0
                            }
                            onResetLTI={() => {
                              updateWidgetValue('d-safety-lti', { value: 0 });
                              updateSafetyCross(30, 'red');
                            }}
                            onIncrementLTI={() => {
                              const currentVal = currentWidgets.find((w) => w.id === 'd-safety-lti')?.value || 0;
                              updateWidgetValue('d-safety-lti', { value: currentVal + 1 });
                            }}
                          />
                        )}

                        {displayedWidgets.map((widget) => (
                          <WidgetCard
                            key={widget.id}
                            widget={widget}
                            onUpdateValue={updateWidgetValue}
                            onToggleChecklist={toggleChecklistItem}
                            onDelete={deleteWidget}
                            userRole={state.currentUserRole}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      
                      {/* Column 1: Safety & Sustainability (Pillar S & S) */}
                      <div className="xl:col-span-4 space-y-6">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-slate-850 dark:text-[#FFC20E]" />
                          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Safety & Environmental Health
                          </h3>
                        </div>
                        
                        {/* Safety Cross Calendar with Daily Notes */}
                        <SafetyCrossCalendar 
                          safetyCross={currentSafetyCross}
                          safetyNotes={currentSafetyNotes}
                          onDayClick={updateSafetyCross}
                          onUpdateNote={updateSafetyNote}
                          daysSinceLastLTI={
                            currentWidgets.find((w) => w.id === 'd-safety-lti')?.value || 0
                          }
                          onResetLTI={() => {
                            updateWidgetValue('d-safety-lti', { value: 0 });
                            updateSafetyCross(30, 'red'); // also trigger safety cross red
                          }}
                          onIncrementLTI={() => {
                            const currentVal = currentWidgets.find((w) => w.id === 'd-safety-lti')?.value || 0;
                            updateWidgetValue('d-safety-lti', { value: currentVal + 1 });
                          }}
                        />

                        {/* Display safety and sustainability daily widgets */}
                        {displayedWidgets
                          .filter((w) => w.pillar === 'Safety' || w.pillar === 'Sustainability')
                          .map((widget) => (
                            <WidgetCard
                              key={widget.id}
                              widget={widget}
                              onUpdateValue={updateWidgetValue}
                              onToggleChecklist={toggleChecklistItem}
                              onDelete={deleteWidget}
                              userRole={state.currentUserRole}
                            />
                          ))}
                      </div>

                      {/* Column 2: Quality & Delivery (Pillar Q & D) */}
                      <div className="xl:col-span-4 space-y-6">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-slate-850 dark:text-[#FFC20E]" />
                          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Quality & Customer Delivery
                          </h3>
                        </div>

                        {displayedWidgets
                          .filter((w) => w.pillar === 'Quality' || w.pillar === 'Delivery')
                          .map((widget) => (
                            <WidgetCard
                              key={widget.id}
                              widget={widget}
                              onUpdateValue={updateWidgetValue}
                              onToggleChecklist={toggleChecklistItem}
                              onDelete={deleteWidget}
                              userRole={state.currentUserRole}
                            />
                          ))}
                      </div>

                      {/* Column 3: Cost & Capital (Pillar C & C) */}
                      <div className="xl:col-span-4 space-y-6">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-slate-850 dark:text-[#FFC20E]" />
                          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Cost Control & Asset Capital
                          </h3>
                        </div>

                        {displayedWidgets
                          .filter((w) => w.pillar === 'Cost' || w.pillar === 'Capital')
                          .map((widget) => (
                            <WidgetCard
                              key={widget.id}
                              widget={widget}
                              onUpdateValue={updateWidgetValue}
                              onToggleChecklist={toggleChecklistItem}
                              onDelete={deleteWidget}
                              userRole={state.currentUserRole}
                            />
                          ))}
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* 2. WEEKLY DEVIATION STAND-UP LEVEL */}
              {activeLevel === 'weekly' && (
                <div className="space-y-6">
                  {/* Summary Ribbon */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 text-[#FFC20E] flex items-center justify-center font-mono font-bold text-sm">
                        S2
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Weekly Stand-up Context</span>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                          Weekly deviation reviews focus on analyzing why Daily targets failed and forming rigorous Countermeasure Action Plans.
                        </h3>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-400 shrink-0">
                      <span>Total Deviations this week: <span className="text-rose-500 font-bold">{currentDeviations.filter(d => !d.isResolved).length} open</span></span>
                    </div>
                  </div>

                  {/* Split Weekly Workspace: Widgets on Left, 5-Why solver on Right */}
                  <div className="space-y-6">
                    {/* First, show the Weekly level metric trackers (Highly editable) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentWidgets
                        .filter((w) => w.level === 'weekly' && (selectedPillarFilter === 'all' || w.pillar === selectedPillarFilter))
                        .map((widget) => (
                          <WidgetCard
                            key={widget.id}
                            widget={widget}
                            onUpdateValue={updateWidgetValue}
                            onToggleChecklist={toggleChecklistItem}
                            onDelete={deleteWidget}
                            userRole={state.currentUserRole}
                          />
                        ))}
                    </div>

                    {/* Integrated 5-Whys Diagram Board & Action Generator */}
                    <div className="pt-4">
                      <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Huddle Stand-up Deviation Solver (Ishikawa categorization & custom Why steps enabled)
                        </h3>
                      </div>
                      <DeviationSolver 
                        deviations={currentDeviations}
                        onUpdateDeviation={updateDeviation}
                        onDeleteDeviation={deleteDeviation}
                        onAddActionItem={addActionItem}
                        actionItems={currentActionItems}
                        userRole={state.currentUserRole}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MONTHLY STRATEGIC LEVEL */}
              {activeLevel === 'monthly' && (
                <div className="space-y-6">
                  {/* Summary ribbon */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 text-[#FFC20E] flex items-center justify-center font-mono font-bold text-sm">
                        S3
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Monthly Strategic Alignment</span>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                          High-level long term targets, capital project validation, corporate carbon compliance, and systemic continuous improvements.
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Render the Monthly strategic Widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentWidgets
                      .filter((w) => w.level === 'monthly' && (selectedPillarFilter === 'all' || w.pillar === selectedPillarFilter))
                      .map((widget) => (
                        <WidgetCard
                          key={widget.id}
                          widget={widget}
                          onUpdateValue={updateWidgetValue}
                          onToggleChecklist={toggleChecklistItem}
                          onDelete={deleteWidget}
                          userRole={state.currentUserRole}
                        />
                      ))}
                  </div>

                  {/* Strategic Dashboard: Vulnerability matrices and CI Ideas Pipeline */}
                  {/* OVERHAULED: With interactive budget planners and funded root cause links (Request #2) */}
                  <StrategicDashboard 
                    widgets={currentWidgets}
                    deviations={currentDeviations}
                    actionItems={currentActionItems}
                    userRole={state.currentUserRole}
                    onUpdateDeviation={updateDeviation}
                  />
                </div>
              )}
            </>
          )}

          {/* 4. MASTER TEAM ACTIONS PLAN TABLE TAB */}
          {activeTab === 'actions' && (
            <ActionPlanTable 
              actionItems={currentActionItems}
              onUpdateActionItem={updateActionItem}
              onDeleteActionItem={deleteActionItem}
              onAddActionItem={addActionItem}
              userRole={state.currentUserRole}
            />
          )}

          {/* 5. APPLET BACKUP AND RESTORE FACILITY TAB */}
          {activeTab === 'backup' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <BackupPanel 
                onExport={exportBackup}
                onImport={importBackup}
                onReset={resetToTemplate}
              />

              {/* Help & Backup info section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Understanding Huddleboard Backup Operations
                </h4>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                  <p>
                    <strong>Why back up?</strong> Because this system runs serverless-compatible browser persistent layers, exporting a backup allows any team member to download their completed 5-Why root cause diagrams, active daily checklists, and countermeasure plans into a single portable file.
                  </p>
                  <p>
                    <strong>Sharing with the team:</strong> To use this as a team, simply export the database backup JSON at the end of a shift stand-up. Other team members can instantly upload this file on their devices to sync the board configuration, log entries, and open actions in real-time.
                  </p>
                  <p>
                    <strong>Vercel ready:</strong> Since Vercel uses zero-state serverless nodes, our self-contained client-side Backup Import & Export protocol guarantees 100% data preservation and offline safety with zero cloud fees.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Editorial footer (No ornamental fake engine latency tickers) */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5 font-mono">
          <span>&copy; 2026 Daily Pulse Huddleboards. Built for continuous operational team excellence.</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span className="font-mono text-[9px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-250">
            EPIROC SSQDCC STANDARD COMPLIANT
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wide bg-[#FFC20E]/15 px-2 py-0.5 rounded text-slate-800 dark:text-amber-400 border border-[#FFC20E]/20 font-bold">
            LEAN CERTIFIED PROCESS
          </span>
        </div>
      </footer>

    </div>
  );
}
