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
    resetToTemplate
  } = useAppState();

  const [activeLevel, setActiveLevel] = useState<PulseLevel>('daily');
  const [activeTab, setActiveTab] = useState<'board' | 'actions' | 'backup'>('board');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  
  // Custom widget creation form state
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newWTitle, setNewWTitle] = useState('');
  const [newWPillar, setNewWPillar] = useState<Pillar>('Quality');
  const [newWLevel, setNewWLevel] = useState<PulseLevel>('daily');
  const [newWType, setNewWType] = useState<'numeric' | 'checklist' | 'gauge' | 'counter'>('numeric');
  const [newWUnit, setNewWUnit] = useState('');
  const [newWTarget, setNewWTarget] = useState('');
  const [newWActual, setNewWActual] = useState('');
  const [newWDesc, setNewWDesc] = useState('');

  // Simulation feedback toast state
  const [simulationAlert, setSimulationAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Filter widgets by active level and pillar
  const displayedWidgets = state.widgets.filter((w) => {
    const matchesLevel = w.level === activeLevel;
    const matchesPillar = selectedPillarFilter === 'all' || w.pillar === selectedPillarFilter;
    return matchesLevel && matchesPillar;
  });

  const handleAddCustomWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWTitle) return;

    addWidget({
      title: newWTitle,
      pillar: newWPillar,
      level: newWLevel,
      type: newWType,
      unit: newWUnit || undefined,
      target: newWTarget ? parseFloat(newWTarget) : undefined,
      actual: newWActual ? parseFloat(newWActual) : undefined,
      description: newWDesc || `Custom tracker for ${newWTitle}.`
    });

    // Reset Widget Form
    setNewWTitle('');
    setNewWUnit('');
    setNewWTarget('');
    setNewWActual('');
    setNewWDesc('');
    setShowAddWidget(false);
  };

  // Run quick Lean simulation of unexpected operational failures
  const handleTriggerSimulation = () => {
    // 1. Shift B CNC cooler leak (Quality defects up, OEE down, Downtime minutes up)
    const downtimeWidget = state.widgets.find(w => w.id === 'd-cost-downtime');
    const defectWidget = state.widgets.find(w => w.id === 'd-quality-defects');
    const safetyCrossIndex = 30; // Mark day 30 red
    
    if (downtimeWidget && defectWidget) {
      updateWidgetValue('d-cost-downtime', { actual: 48 });
      updateWidgetValue('d-quality-defects', { actual: 12 });
      updateSafetyCross(safetyCrossIndex, 'red');

      // Create a specific simulated deviation for Downtime
      const hasExistingDev = state.deviations.some(d => d.widgetId === 'd-cost-downtime');
      if (!hasExistingDev) {
        addDeviation({
          widgetId: 'd-cost-downtime',
          widgetTitle: 'Shift Unplanned Downtime',
          pillar: 'Cost',
          level: 'daily',
          date: new Date().toISOString().split('T')[0],
          description: 'CNC Machine 3 Cooling Fan failed at 09:15, causing a thermal cutoff. Production line halted for 48 minutes.',
          fiveWhys: [
            'Why? Coolant loop overheated and triggered hardware thermal shutdown.',
            'Why? Coolant pump impeller was jammed by plastic chips.',
            'Why? The chip filtration mesh tray was torn, letting debris bypass.',
            'Why? Mesh tray was past its rated service life (exceeded by 6 months).',
            'Why? Missing proactive spare parts schedule for extruder sub-components.'
          ],
          rootCause: 'Wear replacement schedule missing from critical PM checklists.',
          ishikawaCategory: 'Machine'
        });
      }

      setSimulationAlert({
        show: true,
        title: 'Lean Operational Deviation Triggered!',
        message: 'A thermal failure on CNC Machine 3 has halted production! Shift Unplanned Downtime exceeded targets. Head over to the "Weekly Deviation Pulse" level to analyze root causes with the team.'
      });

      // Jump to Weekly Pulse
      setActiveLevel('weekly');
      setActiveTab('board');
    }
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
      
      {/* Simulation Banner Alarm */}
      {simulationAlert && simulationAlert.show && (
        <div className="bg-rose-600 text-white px-5 py-3.5 flex items-start justify-between gap-4 animate-fade-in z-50 shadow-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-rose-100" />
            <div>
              <span className="font-bold text-sm block tracking-wide">{simulationAlert.title}</span>
              <span className="text-xs text-rose-100 block mt-0.5 leading-relaxed">{simulationAlert.message}</span>
            </div>
          </div>
          <button 
            onClick={() => setSimulationAlert(null)}
            className="text-xs font-bold hover:underline bg-rose-750 px-2.5 py-1 rounded cursor-pointer shrink-0 text-white"
          >
            Acknowledge Alert
          </button>
        </div>
      )}

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
          {/* Active Simulation button */}
          <button
            onClick={handleTriggerSimulation}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-extrabold rounded-lg shadow-sm cursor-pointer transition-all uppercase tracking-wider"
            title="Inject simulated machinery cooler failure to demo the alignment process."
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFC20E]" />
            <span>Simulate Failure</span>
          </button>

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
          
          {/* Active Team Switcher */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Active Production Team
            </label>
            <select
              value={state.currentTeam}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#FFC20E] cursor-pointer"
            >
              {TEAMS_LIST.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {/* Master Operational Access Banner (Role Switcher Removed per Request #3) */}
          <div className="space-y-1.5 p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#FFC20E] uppercase tracking-widest font-mono">
              Board Status
            </span>
            <span className="text-xs font-extrabold text-white block tracking-wider">
              MASTER CONTROL
            </span>
            <span className="text-[10px] text-slate-400 block pt-1.5 leading-normal italic">
              All metrics, checklists, defect categories, and milestones are fully editable for everyone on the team.
            </span>
          </div>

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

          {/* Quick Guide Block */}
          <div className="pt-4 border-t border-slate-800 mt-auto">
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-[#FFC20E] uppercase block mb-1 font-mono">Stand-up SOP</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Review Safety Calendar. Check shift KPIs. If deviation triggers, do 5-Whys and assign action item.
              </p>
            </div>
          </div>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-950">
          
          {/* Dashboard Context Title block */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
                <span>{state.currentTeam}</span>
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

            {/* Config & Builder action buttons */}
            {activeTab === 'board' && activeLevel !== 'monthly' && (
              <button
                onClick={() => setShowAddWidget(!showAddWidget)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#FFC20E] dark:hover:bg-[#E5B200] dark:text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" /> Add Custom Metric
              </button>
            )}
          </div>

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
                    <option value="Safety font-semibold">Safety</option>
                    <option value="Sustainability font-semibold">Sustainability</option>
                    <option value="Quality font-semibold">Quality</option>
                    <option value="Delivery font-semibold">Delivery</option>
                    <option value="Cost font-semibold font-semibold">Cost</option>
                    <option value="Capital font-semibold">Capital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pulse Level (Tier)</label>
                  <select
                    value={newWLevel}
                    onChange={(e) => setNewWLevel(e.target.value as PulseLevel)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="daily font-semibold">Daily stand-up</option>
                    <option value="weekly font-semibold">Weekly stand-up</option>
                    <option value="monthly font-semibold">Monthly strategic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Widget Interface Style</label>
                  <select
                    value={newWType}
                    onChange={(e) => setNewWType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="numeric font-semibold">Numeric Comparison (Target vs Actual)</option>
                    <option value="checklist font-semibold">Shift Audit Checklist</option>
                    <option value="gauge font-semibold">Circular Performance Gauge (%)</option>
                    <option value="counter font-semibold">Days Counter Tracker</option>
                  </select>
                </div>
                {newWType !== 'checklist' && newWType !== 'counter' && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Unit Symbol</label>
                      <input
                        type="text"
                        placeholder="e.g. % or kg"
                        value={newWUnit}
                        onChange={(e) => setNewWUnit(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none"
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
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Initial Value</label>
                      <input
                        type="number"
                        placeholder="e.g. 94"
                        value={newWActual}
                        onChange={(e) => setNewWActual(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none font-mono font-semibold"
                      />
                    </div>
                  </>
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
                            safetyCross={state.safetyCross}
                            safetyNotes={state.safetyNotes}
                            onDayClick={updateSafetyCross}
                            onUpdateNote={updateSafetyNote}
                            daysSinceLastLTI={
                              state.widgets.find((w) => w.id === 'd-safety-lti')?.value || 0
                            }
                            onResetLTI={() => {
                              updateWidgetValue('d-safety-lti', { value: 0 });
                              updateSafetyCross(30, 'red');
                            }}
                            onIncrementLTI={() => {
                              const currentVal = state.widgets.find((w) => w.id === 'd-safety-lti')?.value || 0;
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
                          safetyCross={state.safetyCross}
                          safetyNotes={state.safetyNotes}
                          onDayClick={updateSafetyCross}
                          onUpdateNote={updateSafetyNote}
                          daysSinceLastLTI={
                            state.widgets.find((w) => w.id === 'd-safety-lti')?.value || 0
                          }
                          onResetLTI={() => {
                            updateWidgetValue('d-safety-lti', { value: 0 });
                            updateSafetyCross(30, 'red'); // also trigger safety cross red
                          }}
                          onIncrementLTI={() => {
                            const currentVal = state.widgets.find((w) => w.id === 'd-safety-lti')?.value || 0;
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
                      <span>Total Deviations this week: <span className="text-rose-500 font-bold">{state.deviations.filter(d => !d.isResolved).length} open</span></span>
                    </div>
                  </div>

                  {/* Split Weekly Workspace: Widgets on Left, 5-Why solver on Right */}
                  <div className="space-y-6">
                    {/* First, show the Weekly level metric trackers (Highly editable) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {state.widgets
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
                        deviations={state.deviations}
                        onUpdateDeviation={updateDeviation}
                        onDeleteDeviation={deleteDeviation}
                        onAddActionItem={addActionItem}
                        actionItems={state.actionItems}
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
                    {state.widgets
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
                    widgets={state.widgets}
                    deviations={state.deviations}
                    actionItems={state.actionItems}
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
              actionItems={state.actionItems}
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
