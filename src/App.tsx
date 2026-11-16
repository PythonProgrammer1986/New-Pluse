/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from './useAppState';
import { Pillar, PulseLevel, MetricWidget } from './types';
import SafetyCrossCalendar from './components/SafetyCrossCalendar';
import WidgetCard from './components/WidgetCard';
import DeviationSolver from './components/DeviationSolver';
import ActionPlanTable from './components/ActionPlanTable';
import BackupPanel from './components/BackupPanel';
import HoursPlanner from './components/HoursPlanner';
import ResourceMaster from './components/ResourceMaster';
import ExcelSyncModal from './components/ExcelSyncModal';
import ProjectMatrixView from './components/ProjectMatrixView';
import HuddleRunnerModal from './components/HuddleRunnerModal';
import HuddleStickyNotesPanel from './components/HuddleStickyNotesPanel';
import HuddleScribeModal from './components/HuddleScribeModal';
import VoiceInputButton from './components/VoiceInputButton';
import {
  Shield,
  Leaf,
  CheckCircle,
  TrendingUp,
  Coins,
  HardHat,
  Calendar,
  AlertTriangle,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  FileSpreadsheet,
  Play,
  MessageSquare,
  Search,
  X
} from 'lucide-react';

const TAB_META: Record<
  'board' | 'actions' | 'hours' | 'master' | 'matrix' | 'backup',
  { breadcrumb: string; title: string }
> = {
  board: { breadcrumb: 'pulse huddleboard', title: 'Operational Pulse' },
  actions: { breadcrumb: 'Countermeasures register', title: 'Action Plan & Countermeasure Registry' },
  hours: { breadcrumb: 'Capacity & time tracking', title: 'Team Hours Planner' },
  master: { breadcrumb: 'Workforce directory', title: 'Resource Master Roster' },
  matrix: { breadcrumb: 'Launch & operations tracker', title: 'Project Tracking Matrix' },
  backup: { breadcrumb: 'Snapshots & JSON export', title: 'Backup & Restore Facility' }
};

export default function App() {
  const {
    state,
    updateWidgetValue,
    toggleChecklistItem,
    updateSafetyCross,
    updateSafetyNote,
    addWidget,
    deleteWidget,
    reorderWidgets,
    addDeviation,
    addMetricToWeeklyAnalysis,
    removeMetricFromWeeklyAnalysis,
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
    deleteSnapshot,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addTimeBooking,
    updateTimeBooking,
    deleteTimeBooking,
    setActiveProjectId,
    addProjectMatrix,
    updateProjectMatrix,
    deleteProjectMatrix,
    duplicateProjectMatrix,
    addMatrixPoint,
    updateMatrixPoint,
    deleteMatrixPoint,
    duplicateMatrixPoint,
    addMatrixSubPoint,
    updateMatrixSubPoint,
    deleteMatrixSubPoint,
    addCustomMatrixCategory,
    deleteCustomMatrixCategory,
    updateCustomMatrixCategory,
    togglePinWidget,
    togglePinPoint,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    addPointAttachment,
    deletePointAttachment,
    addActionItemAttachment,
    deleteActionItemAttachment,
    loadLinkedOperationsFile
  } = useAppState();

  const [activeLevel, setActiveLevel] = useState<PulseLevel>('daily');
  const [activeTab, setActiveTab] = useState<
    'board' | 'actions' | 'backup' | 'hours' | 'master' | 'matrix'
  >('board');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');

  const [showHuddleRunner, setShowHuddleRunner] = useState<boolean>(false);
  const [showStickyNotes, setShowStickyNotes] = useState<boolean>(false);
  const [showHuddleScribe, setShowHuddleScribe] = useState<boolean>(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState<string>('');
  const [backupToast, setBackupToast] = useState<string | null>(null);

  // Custom widget creation form state
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showExcelSyncModal, setShowExcelSyncModal] = useState(false);
  const [newWTitle, setNewWTitle] = useState('');
  const [newWPillar, setNewWPillar] = useState<Pillar>('Quality');
  const [newWLevel, setNewWLevel] = useState<PulseLevel>('daily');
  const [newWType, setNewWType] = useState<MetricWidget['type']>('numeric');
  const [newWUnit, setNewWUnit] = useState('');
  const [newWTarget, setNewWTarget] = useState('');
  const [newWActual, setNewWActual] = useState('');
  const [newWDesc, setNewWDesc] = useState('');
  const [newWOwner, setNewWOwner] = useState('');
  const [newWWarningThreshold, setNewWWarningThreshold] = useState<string>('110');
  const [newWLinkedId, setNewWLinkedId] = useState<string>('');

  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChartText, setNewChartText] = useState('');
  const [newProjectText, setNewProjectText] = useState('');

  // Archive snapshot selection states
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string>('live');
  const [snapshotTargetDate, setSnapshotTargetDate] = useState<string>(todayStr);

  const activeSnapshot =
    selectedSnapshotDate !== 'live' && state.history ? state.history[selectedSnapshotDate] : null;

  const currentWidgets = activeSnapshot ? activeSnapshot.widgets : state.widgets;
  const currentDeviations = activeSnapshot ? activeSnapshot.deviations : state.deviations;
  const currentActionItems = activeSnapshot ? activeSnapshot.actionItems : state.actionItems;
  const currentSafetyCross = activeSnapshot ? activeSnapshot.safetyCross : state.safetyCross;
  const currentSafetyNotes = activeSnapshot ? activeSnapshot.safetyNotes : state.safetyNotes || {};
  const currentEmployees = activeSnapshot ? activeSnapshot.employees || [] : state.employees || [];
  const currentTimeBookings = activeSnapshot
    ? activeSnapshot.timeBookings || []
    : state.timeBookings || [];

  const displayedWidgets = currentWidgets
    .filter((w) => {
      const matchesLevel = w.level === activeLevel;
      const matchesPillar = selectedPillarFilter === 'all' || w.pillar === selectedPillarFilter;
      const q = boardSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        w.title.toLowerCase().includes(q) ||
        (w.owner && w.owner.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        w.pillar.toLowerCase().includes(q);
      return matchesLevel && matchesPillar && matchesSearch;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const renderWidgetCard = (widget: MetricWidget) => (
    <WidgetCard
      key={widget.id}
      widget={widget}
      onUpdateValue={updateWidgetValue}
      onToggleChecklist={toggleChecklistItem}
      onDelete={deleteWidget}
      userRole={state.currentUserRole}
      onReorder={reorderWidgets}
      onTogglePin={togglePinWidget}
      onNavigateToProjectMatrix={() => setActiveTab('matrix')}
      projects={state.projectMatrices || []}
      isInWeeklyAnalysis={currentDeviations.some((d) => d.widgetId === widget.id && !d.isResolved)}
      onAddToWeeklyAnalysis={(id) => {
        addMetricToWeeklyAnalysis(id);
        const w = currentWidgets.find((item) => item.id === id);
        setBackupToast(`Added "${w ? w.title : id}" to Weekly Analysis`);
        setTimeout(() => setBackupToast(null), 3000);
      }}
      onRemoveFromWeeklyAnalysis={(id) => {
        removeMetricFromWeeklyAnalysis(id);
        const w = currentWidgets.find((item) => item.id === id);
        setBackupToast(`Removed "${w ? w.title : id}" from Weekly Analysis`);
        setTimeout(() => setBackupToast(null), 3000);
      }}
      onNavigateToWeeklyAnalysis={() => {
        setActiveLevel('weekly');
        setActiveTab('board');
      }}
    />
  );

  const handleAddCustomWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWTitle.trim()) return;

    let checklistData = undefined;
    if (newWType === 'checklist') {
      const items = newChecklistText ? newChecklistText.split(',') : [];
      checklistData =
        items.length > 0
          ? items.map((it, idx) => ({ id: `chk-${idx}-${Date.now()}`, label: it.trim(), checked: false }))
          : [
              { id: 'c-1', label: 'Verify equipment compliance checks', checked: false },
              { id: 'c-2', label: 'Perform standard 5S workspace sweep', checked: false }
            ];
    }

    let chartData = undefined;
    if (newWType === 'chart') {
      const categories = newChartText ? newChartText.split(',') : [];
      chartData =
        categories.length > 0
          ? categories.map((cat) => ({ label: cat.trim(), value: 0, target: 1 }))
          : [
              { label: 'Surface Scratches', value: 0, target: 1 },
              { label: 'Dimensional Deviations', value: 0, target: 1 }
            ];
    } else if (newWType === 'skills') {
      chartData = [
        { label: 'Operator A', value: 3, target: 4 },
        { label: 'Operator B', value: 2, target: 4 },
        { label: 'Operator C', value: 4, target: 4 }
      ];
    } else if (newWType === 'radar') {
      chartData = [
        { label: 'Sort (Seiri)', value: 90, target: 100 },
        { label: 'Set in Order (Seiton)', value: 85, target: 100 },
        { label: 'Shine (Seiso)', value: 95, target: 100 },
        { label: 'Standardize (Seiketsu)', value: 80, target: 100 },
        { label: 'Sustain (Shitsuke)', value: 85, target: 100 }
      ];
    } else if (newWType === 'pareto') {
      chartData = [
        { label: 'Startup Loss', value: 35, target: 10 },
        { label: 'Tool Defect', value: 25, target: 10 },
        { label: 'Operator Error', value: 15, target: 5 }
      ];
    } else if (newWType === 'heatmap') {
      chartData = Array.from({ length: 24 }).map((_, idx) => ({
        label: `${idx}:00`,
        value: 0
      }));
    }

    let milestonesData = undefined;
    if (newWType === 'project') {
      const ms = newProjectText ? newProjectText.split(',') : [];
      milestonesData =
        ms.length > 0
          ? ms.map((m, idx) => ({
              id: `ms-${idx}-${Date.now()}`,
              name: m.trim(),
              status: 'pending' as const,
              owner: 'Team Lead',
              dueDate: todayStr
            }))
          : [
              {
                id: 'm-1',
                name: 'Draft Design and Engineering Plan',
                status: 'pending' as const,
                owner: 'Team Lead',
                dueDate: todayStr
              },
              {
                id: 'm-2',
                name: 'Tooling installation & dry run',
                status: 'pending' as const,
                owner: 'Maintenance',
                dueDate: todayStr
              }
            ];
    } else if (newWType === 'kanban') {
      milestonesData = [
        {
          id: `kb-1-${Date.now()}`,
          name: 'Tool Cart 5S Layout',
          status: 'pending' as const,
          owner: 'Operator A',
          dueDate: todayStr
        },
        {
          id: `kb-2-${Date.now()}`,
          name: 'LED Takt Signal Indicator',
          status: 'active' as const,
          owner: 'Team Lead',
          dueDate: todayStr
        },
        {
          id: `kb-3-${Date.now()}`,
          name: 'LOTO Safety Box Upgrade',
          status: 'completed' as const,
          owner: 'EHS Engineer',
          dueDate: todayStr
        }
      ];
    } else if (newWType === 'countdown') {
      milestonesData = [
        {
          id: `cd-1-${Date.now()}`,
          name: '1. Material Loading',
          status: 'completed' as const,
          owner: 'Logistics',
          dueDate: todayStr
        },
        {
          id: `cd-2-${Date.now()}`,
          name: '2. Sub-Assembly',
          status: 'completed' as const,
          owner: 'Assembly',
          dueDate: todayStr
        },
        {
          id: `cd-3-${Date.now()}`,
          name: '3. QA Test Run',
          status: 'active' as const,
          owner: 'QA Inspector',
          dueDate: todayStr
        },
        {
          id: `cd-4-${Date.now()}`,
          name: '4. Final Dispatch',
          status: 'pending' as const,
          owner: 'Shipping',
          dueDate: todayStr
        }
      ];
    }

    const targetVal = newWTarget
      ? parseFloat(newWTarget)
      : newWType === 'gauge'
      ? 100
      : newWType === 'riskGauge'
      ? 100
      : newWType === 'emission'
      ? 150
      : newWType === 'pulse'
      ? 80
      : newWType === 'stopwatch'
      ? 45
      : undefined;
    const actualVal = newWActual
      ? parseFloat(newWActual)
      : newWType === 'gauge'
      ? 0
      : newWType === 'riskGauge'
      ? 25
      : newWType === 'emission'
      ? 120
      : newWType === 'pulse'
      ? 80
      : newWType === 'stopwatch'
      ? 0
      : undefined;
    const numericValue = newWType === 'counter' ? parseFloat(newWActual) || 0 : undefined;
    const warningThresholdVal = newWWarningThreshold ? parseFloat(newWWarningThreshold) : undefined;

    addWidget({
      title: newWTitle.trim(),
      pillar: newWPillar,
      level: newWLevel,
      type: newWType,
      unit: newWUnit || undefined,
      owner: newWOwner || undefined,
      target: targetVal,
      actual: actualVal,
      value: numericValue,
      warningThreshold: warningThresholdVal,
      checklist: checklistData,
      dataPoints: chartData,
      milestones: milestonesData,
      description: newWDesc || `Custom tracker for ${newWTitle.trim()}.`,
      linkedWidgetId: newWLinkedId || undefined
    });

    setNewWTitle('');
    setNewWOwner('');
    setNewWUnit('');
    setNewWTarget('');
    setNewWActual('');
    setNewWDesc('');
    setNewWWarningThreshold('110');
    setNewWLinkedId('');
    setNewChecklistText('');
    setNewChartText('');
    setNewProjectText('');
    setShowAddWidget(false);
  };

  const getPillarIcon = (p: Pillar) => {
    switch (p) {
      case 'Safety':
        return Shield;
      case 'Sustainability':
        return Leaf;
      case 'Quality':
        return CheckCircle;
      case 'Delivery':
        return TrendingUp;
      case 'Cost':
        return Coins;
      case 'Capital':
        return HardHat;
    }
  };

  const unresolvedDeviationsCount = state.deviations.filter((d) => !d.isResolved).length;

  const pageHeading =
    activeTab === 'board'
      ? activeLevel === 'daily'
        ? 'Daily Stand-up Huddleboard'
        : activeLevel === 'weekly'
        ? 'Weekly Deviations Stand-up'
        : 'Monthly Strategic Performance Board'
      : TAB_META[activeTab].title;

  const pageBreadcrumb =
    activeTab === 'board' ? `${activeLevel} level pulse` : TAB_META[activeTab].breadcrumb;

  return (
    <div className="min-h-screen bg-white text-[#262A2E] flex flex-col font-sans">
      {/* Top Bar Navigation (Pure White + Epiroc Grey & Yellow) */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-40 shadow-xs text-[#262A2E] shrink-0">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFC20E] flex items-center justify-center text-[#1F2328] font-black shadow-xs">
            <span>E</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-[#262A2E] uppercase flex items-center gap-1.5">
              Epiroc{' '}
              <span className="text-[#4B5563] font-semibold text-xs lowercase font-mono">
                Pulse
              </span>
            </h1>
            <span className="text-[10px] text-[#6B7280] font-bold block leading-none font-mono tracking-widest uppercase">
              EPS Huddleboard
            </span>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="flex flex-wrap items-center gap-1 p-1 bg-[#F3F4F6] rounded-xl border border-gray-200">
          {(['daily', 'weekly', 'monthly'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setActiveLevel(lvl);
                setActiveTab('board');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
                activeLevel === lvl && activeTab === 'board'
                  ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                  : 'text-[#4B5563] hover:text-[#262A2E] hover:bg-white/70'
              }`}
            >
              {lvl}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'actions'
                ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                : 'text-[#4B5563] hover:text-[#262A2E] hover:bg-white/70'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'hours'
                ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                : 'text-[#4B5563] hover:text-[#262A2E] hover:bg-white/70'
            }`}
          >
            Hours
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'master'
                ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                : 'text-[#4B5563] hover:text-[#262A2E] hover:bg-white/70'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'matrix'
                ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                : 'text-[#4B5563] hover:text-[#262A2E] hover:bg-white/70'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${
              activeTab === 'backup'
                ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                : 'text-[#4B5563] hover:text-[#262A2E] hover:bg-white/70'
            }`}
          >
            Backups
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowStickyNotes(!showStickyNotes)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showStickyNotes
                ? 'bg-[#FFC20E] text-[#1F2328] border-[#FFC20E]'
                : 'bg-white hover:bg-[#F7F8F9] text-[#262A2E] border-gray-200'
            }`}
            title="Shift sticky notes & team handover board"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#E5AE00]" />
            <span className="hidden sm:inline">Shift Notes</span>
            <span className="bg-[#FFFBEB] text-[#1F2328] border border-[#FFC20E]/50 text-[10px] font-mono px-1.5 rounded-full font-bold">
              {(state.stickyNotes || []).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowHuddleScribe(true)}
            className="px-3 py-1.5 bg-[#262A2E] hover:bg-[#3A3F45] text-[#FFC20E] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono uppercase tracking-wider"
            title="Launch AI Huddle Scribe to parse spoken meeting updates"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Scribe</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHuddleRunner(true)}
            className="px-3.5 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-mono uppercase tracking-wider"
            title="Launch 15-Minute Daily Stand-up Huddle Runner"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>15-Min Huddle</span>
          </button>

          <div className="hidden xl:flex flex-col text-right font-mono text-[10px] text-[#6B7280] pl-1 border-l border-gray-200">
            <span className="font-semibold text-[#262A2E]">Day Shift</span>
            <span>{todayStr}</span>
          </div>
        </div>
      </header>

      {/* Connected Feature: Weekly Deviation Queue Banner */}
      {activeTab === 'board' && activeLevel === 'daily' && unresolvedDeviationsCount > 0 && (
        <div
          onClick={() => {
            setActiveLevel('weekly');
            setActiveTab('board');
          }}
          className="bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#1F2328] text-xs font-bold px-6 py-2.5 flex items-center justify-between cursor-pointer border-b border-[#FFC20E]/60 shrink-0 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
            <span>
              {unresolvedDeviationsCount} unresolved deviation(s) queued in Weekly 5-Why Root Cause Analysis.
            </span>
          </div>
          <span className="inline-flex items-center gap-1 underline uppercase text-[10px] font-black shrink-0 tracking-wider">
            <span>Open Weekly Solver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* Full-Width Main Workspace Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
        {/* Dashboard Context Title & Actions */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-bold mb-1 uppercase tracking-wider font-mono">
              <span>Epiroc Global Operations</span>
              <ChevronRight className="w-3 h-3" />
              <span>{pageBreadcrumb}</span>
            </div>
            <h2 className="text-xl font-black text-[#262A2E] tracking-tight uppercase">
              {pageHeading}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Compact Snapshot Selector */}
            <div className="flex flex-wrap items-center gap-2 border border-gray-200 bg-[#F7F8F9] p-1.5 rounded-xl shrink-0">
              <div className="flex items-center gap-1.5 px-1">
                <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider font-mono">
                  Snapshot:
                </span>
              </div>
              <select
                value={selectedSnapshotDate}
                onChange={(e) => setSelectedSnapshotDate(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-[#262A2E] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
              >
                <option value="live">Live Board</option>
                {state.history &&
                  Object.keys(state.history)
                    .sort()
                    .reverse()
                    .map((dateStr) => (
                      <option key={dateStr} value={dateStr}>
                        {dateStr} (Archive)
                      </option>
                    ))}
              </select>

              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                <input
                  type="date"
                  value={snapshotTargetDate}
                  onChange={(e) => setSnapshotTargetDate(e.target.value)}
                  className="text-[11px] font-mono px-2 py-1 rounded-lg border border-gray-200 bg-white text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!snapshotTargetDate) {
                      setBackupToast('Please select a date.');
                      setTimeout(() => setBackupToast(null), 3000);
                      return;
                    }
                    saveSnapshot(snapshotTargetDate);
                    setSelectedSnapshotDate(snapshotTargetDate);
                    setBackupToast(`Saved snapshot for ${snapshotTargetDate}`);
                    setTimeout(() => setBackupToast(null), 3000);
                  }}
                  className="px-2.5 py-1 bg-[#262A2E] hover:bg-[#3A3F45] text-white hover:text-[#FFC20E] text-[10px] font-bold rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                  title="Save current board state as dated snapshot"
                >
                  Save Snapshot
                </button>
              </div>
            </div>

            {activeTab === 'board' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search KPIs, owners..."
                    value={boardSearchQuery}
                    onChange={(e) => setBoardSearchQuery(e.target.value)}
                    className="text-xs pl-8 pr-16 py-2 rounded-lg border border-gray-200 bg-[#F7F8F9] text-[#262A2E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFC20E] focus:bg-white w-48 sm:w-56 font-medium"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    {boardSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBoardSearchQuery('')}
                        className="p-1 text-[#6B7280] hover:text-[#262A2E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <VoiceInputButton
                      onTranscript={(txt) => setBoardSearchQuery(txt)}
                      className="scale-90"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowExcelSyncModal(true)}
                  className="px-3 py-2 bg-white hover:bg-[#F7F8F9] text-[#262A2E] border border-gray-200 hover:border-[#FFC20E] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer font-mono uppercase tracking-wider"
                  title="Import & sync metric values from Excel or CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#E5AE00]" />
                  <span>Sync Excel</span>
                </button>

                {activeLevel !== 'monthly' && (
                  <button
                    onClick={() => {
                      setNewWLevel(activeLevel);
                      setShowAddWidget(!showAddWidget);
                    }}
                    className="px-3.5 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer uppercase tracking-wider font-mono"
                  >
                    <Plus className="w-4 h-4" /> Add Metric
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal SSQDCC Pillar Filter Strip (Board tabs only) */}
        {activeTab === 'board' && (
          <div className="flex flex-wrap items-center gap-2 bg-[#F7F8F9] border border-gray-200 p-2 rounded-xl">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider font-mono px-2">
              SSQDCC Filter:
            </span>
            <button
              onClick={() => setSelectedPillarFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPillarFilter === 'all'
                  ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                  : 'bg-white text-[#4B5563] border border-gray-200 hover:text-[#262A2E]'
              }`}
            >
              <span>All Pillars</span>
              <span className="font-mono text-[10px] opacity-80">
                ({currentWidgets.filter((w) => w.level === activeLevel).length})
              </span>
            </button>

            {(['Safety', 'Sustainability', 'Quality', 'Delivery', 'Cost', 'Capital'] as Pillar[]).map(
              (p) => {
                const count = currentWidgets.filter(
                  (w) => w.level === activeLevel && w.pillar === p
                ).length;
                const PillarIcon = getPillarIcon(p);
                const isSelected = selectedPillarFilter === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPillarFilter(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                        : 'bg-white text-[#4B5563] border border-gray-200 hover:text-[#262A2E]'
                    }`}
                  >
                    <PillarIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{p}</span>
                    <span className="font-mono text-[10px] opacity-75">({count})</span>
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* Toast Notification */}
        {backupToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#262A2E] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-fade-in flex items-center gap-2 border border-gray-700">
            <Check className="w-4 h-4 text-[#FFC20E]" />
            <span>{backupToast}</span>
          </div>
        )}

        {/* Historical Read-Only Archive Banner */}
        {selectedSnapshotDate !== 'live' && (
          <div className="bg-[#FFFBEB] border border-[#FFC20E] p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-sm text-[#262A2E] block">
                  Viewing Historical Snapshot: {selectedSnapshotDate}
                </span>
                <span className="text-xs text-[#4B5563] block mt-1 leading-relaxed">
                  You are inspecting a preserved snapshot from <strong>{selectedSnapshotDate}</strong>.
                  Restore it to make changes live or return to the active board.
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  restoreSnapshot(selectedSnapshotDate);
                  setSelectedSnapshotDate('live');
                }}
                className="px-3.5 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-lg shadow-xs cursor-pointer transition-all"
              >
                Restore to Live
              </button>
              <button
                onClick={() => {
                  deleteSnapshot(selectedSnapshotDate);
                  setSelectedSnapshotDate('live');
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedSnapshotDate('live')}
                className="px-2.5 py-1.5 bg-white hover:bg-[#F3F4F6] border border-gray-200 text-[#3A3F45] text-xs font-bold rounded-lg cursor-pointer transition-all"
              >
                Exit Archive
              </button>
            </div>
          </div>
        )}

        {/* Add Custom Widget Overlay Form */}
        {showAddWidget && (
          <form
            onSubmit={handleAddCustomWidget}
            className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h4 className="font-extrabold text-[#262A2E] text-sm uppercase tracking-wider">
                Add Custom KPI Tracker
              </h4>
              <button
                type="button"
                onClick={() => setShowAddWidget(false)}
                className="p-1.5 hover:bg-[#F3F4F6] rounded-lg text-[#6B7280] hover:text-[#262A2E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  KPI Title *
                </label>
                <input
                  type="text"
                  required
                  value={newWTitle}
                  onChange={(e) => setNewWTitle(e.target.value)}
                  placeholder="e.g. Daily First Pass Yield"
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] focus:bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Metric Owner
                </label>
                <input
                  type="text"
                  value={newWOwner}
                  onChange={(e) => setNewWOwner(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] focus:bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  SSQDCC Pillar
                </label>
                <select
                  value={newWPillar}
                  onChange={(e) => setNewWPillar(e.target.value as Pillar)}
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold"
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
                  Pulse Level
                </label>
                <select
                  value={newWLevel}
                  onChange={(e) => setNewWLevel(e.target.value as PulseLevel)}
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold"
                >
                  <option value="daily">Daily Stand-up</option>
                  <option value="weekly">Weekly Stand-up</option>
                  <option value="monthly">Monthly Strategic</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Widget Type
                </label>
                <select
                  value={newWType}
                  onChange={(e) => setNewWType(e.target.value as MetricWidget['type'])}
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold"
                >
                  <option value="numeric">Target vs Actual (Numeric)</option>
                  <option value="checklist">Action Checklist</option>
                  <option value="gauge">Circular Gauge (%)</option>
                  <option value="counter">Consecutive Counter</option>
                  <option value="chart">Categorized Bar Chart</option>
                  <option value="project">Milestone Roadmap</option>
                  <option value="stopwatch">Cycle Time Stopwatch</option>
                  <option value="heatmap">Hourly Heatmap Grid</option>
                  <option value="skills">Competency Skill Matrix</option>
                  <option value="kanban">Kaizen Kanban Cards</option>
                  <option value="handover">Shift Handover Sign-off</option>
                  <option value="radar">5S Audit Radar</option>
                  <option value="pareto">Scrap & Waste Pareto</option>
                  <option value="riskGauge">Hazard Alert Gauge</option>
                  <option value="emission">CO2 Emission Trace</option>
                  <option value="countdown">Lead Time Countdown</option>
                  <option value="pulse">Takt-Time Pace Pulse</option>
                  <option value="projectMatrix">Linked Project Matrix</option>
                </select>
              </div>

              {['numeric', 'gauge', 'stopwatch', 'riskGauge', 'emission', 'pulse'].includes(
                newWType
              ) && (
                <>
                  <div>
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                      Unit Symbol
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. % or kg or s"
                      value={newWUnit}
                      onChange={(e) => setNewWUnit(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                      Target Limit
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 95"
                      value={newWTarget}
                      onChange={(e) => setNewWTarget(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                      Initial Actual
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 94"
                      value={newWActual}
                      onChange={(e) => setNewWActual(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                      Warning Threshold (%)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 110"
                      value={newWWarningThreshold}
                      onChange={(e) => setNewWWarningThreshold(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                    />
                  </div>
                </>
              )}

              {newWType === 'counter' && (
                <div>
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Initial Counter Value
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={newWActual}
                    onChange={(e) => setNewWActual(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                  />
                </div>
              )}

              {newWType === 'checklist' && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Checklist Steps (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clean surface, Inspect hydraulic lines, Check E-stops"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  />
                </div>
              )}

              {newWType === 'chart' && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Defect Categories (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surface Scratches, Dimension Fail, Seal Leak"
                    value={newChartText}
                    onChange={(e) => setNewChartText(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  />
                </div>
              )}

              {newWType === 'project' && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                    Roadmap Milestones (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Design Spec, Supplier Sourcing, Calibration, Live Run"
                    value={newProjectText}
                    onChange={(e) => setNewProjectText(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">
                  Sync Link (Optional Roll-up Source)
                </label>
                <select
                  value={newWLinkedId}
                  onChange={(e) => setNewWLinkedId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold cursor-pointer"
                >
                  <option value="">Standalone Metric (No link)</option>
                  {state.widgets
                    .filter((w) => w.level !== newWLevel)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        [{w.level.toUpperCase()}] [{w.pillar}] {w.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  KPI Description
                </label>
                <input
                  type="text"
                  placeholder="Purpose & operating definition..."
                  value={newWDesc}
                  onChange={(e) => setNewWDesc(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-[#F7F8F9] text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddWidget(false)}
                className="px-3.5 py-2 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-black rounded-lg shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Deploy Metric
              </button>
            </div>
          </form>
        )}

        {/* ACTIVE WORKSPACE */}
        {activeTab === 'board' && (
          <>
            {/* 1. DAILY PULSE LEVEL */}
            {activeLevel === 'daily' && (
              <div className="space-y-6">
                {selectedPillarFilter !== 'all' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#4B5563] font-bold uppercase tracking-wider font-mono">
                      <span>Showing {selectedPillarFilter} Operational Pulse</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPillarFilter('all')}
                        className="text-[#262A2E] underline cursor-pointer"
                      >
                        Show All Pillars
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
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
                            updateSafetyCross(new Date().getDate(), 'red');
                          }}
                          onIncrementLTI={() => {
                            const currentVal =
                              currentWidgets.find((w) => w.id === 'd-safety-lti')?.value || 0;
                            updateWidgetValue('d-safety-lti', { value: currentVal + 1 });
                          }}
                        />
                      )}

                      {displayedWidgets.map((widget) => renderWidgetCard(widget))}
                    </div>

                    {displayedWidgets.length === 0 && selectedPillarFilter !== 'Safety' && (
                      <div className="py-10 text-center bg-[#F7F8F9] border border-dashed border-gray-300 rounded-xl text-xs text-[#6B7280]">
                        No matching metrics found for {selectedPillarFilter}.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Column 1: Safety & Sustainability */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        if (draggedId) {
                          const w = state.widgets.find((item) => item.id === draggedId);
                          if (w && w.pillar !== 'Safety' && w.pillar !== 'Sustainability') {
                            updateWidgetValue(draggedId, { pillar: 'Safety' });
                          }
                        }
                      }}
                      className="xl:col-span-4 space-y-5 min-h-[400px] rounded-xl p-1 transition-all border border-transparent hover:border-gray-200"
                    >
                      <div className="border-b border-gray-200 pb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#262A2E]" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#262A2E]">
                          Safety & Environmental Health
                        </h3>
                      </div>

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
                          updateSafetyCross(new Date().getDate(), 'red');
                        }}
                        onIncrementLTI={() => {
                          const currentVal =
                            currentWidgets.find((w) => w.id === 'd-safety-lti')?.value || 0;
                          updateWidgetValue('d-safety-lti', { value: currentVal + 1 });
                        }}
                      />

                      {displayedWidgets
                        .filter((w) => w.pillar === 'Safety' || w.pillar === 'Sustainability')
                        .map((widget) => renderWidgetCard(widget))}
                    </div>

                    {/* Column 2: Quality & Delivery */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        if (draggedId) {
                          const w = state.widgets.find((item) => item.id === draggedId);
                          if (w && w.pillar !== 'Quality' && w.pillar !== 'Delivery') {
                            updateWidgetValue(draggedId, { pillar: 'Quality' });
                          }
                        }
                      }}
                      className="xl:col-span-4 space-y-5 min-h-[400px] rounded-xl p-1 transition-all border border-transparent hover:border-gray-200"
                    >
                      <div className="border-b border-gray-200 pb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#262A2E]" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#262A2E]">
                          Quality & Customer Delivery
                        </h3>
                      </div>

                      {displayedWidgets
                        .filter((w) => w.pillar === 'Quality' || w.pillar === 'Delivery')
                        .map((widget) => renderWidgetCard(widget))}
                    </div>

                    {/* Column 3: Cost & Capital */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        if (draggedId) {
                          const w = state.widgets.find((item) => item.id === draggedId);
                          if (w && w.pillar !== 'Cost' && w.pillar !== 'Capital') {
                            updateWidgetValue(draggedId, { pillar: 'Cost' });
                          }
                        }
                      }}
                      className="xl:col-span-4 space-y-5 min-h-[400px] rounded-xl p-1 transition-all border border-transparent hover:border-gray-200"
                    >
                      <div className="border-b border-gray-200 pb-2 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-[#262A2E]" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#262A2E]">
                          Cost Control & Asset Capital
                        </h3>
                      </div>

                      {displayedWidgets
                        .filter((w) => w.pillar === 'Cost' || w.pillar === 'Capital')
                        .map((widget) => renderWidgetCard(widget))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. WEEKLY DEVIATION STAND-UP */}
            {activeLevel === 'weekly' && (
              <div className="space-y-6">
                {displayedWidgets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedWidgets.map((widget) => renderWidgetCard(widget))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-[#F7F8F9] border border-dashed border-gray-300 rounded-xl text-xs text-[#6B7280]">
                    No weekly metrics match the active filter or search query.
                  </div>
                )}

                <div className="pt-2">
                  <div className="border-b border-gray-200 pb-2 mb-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#262A2E]">
                      Weekly Deviation Solver (Ishikawa & 5-Why Root Cause Analysis)
                    </h3>
                  </div>
                  <DeviationSolver
                    deviations={currentDeviations}
                    onUpdateDeviation={updateDeviation}
                    onDeleteDeviation={deleteDeviation}
                    onAddActionItem={addActionItem}
                    onAddDeviation={addDeviation}
                    actionItems={currentActionItems}
                    userRole={state.currentUserRole}
                    widgets={currentWidgets}
                    onAddMetricToWeekly={(id) => {
                      addMetricToWeeklyAnalysis(id);
                      const w = currentWidgets.find((item) => item.id === id);
                      setBackupToast(`Added "${w ? w.title : id}" to Weekly Analysis`);
                      setTimeout(() => setBackupToast(null), 3000);
                    }}
                  />
                </div>
              </div>
            )}

            {/* 3. MONTHLY STRATEGIC LEVEL */}
            {activeLevel === 'monthly' && (
              <div className="space-y-6">
                {displayedWidgets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedWidgets.map((widget) => renderWidgetCard(widget))}
                  </div>
                ) : (
                  <div className="py-10 text-center bg-[#F7F8F9] border border-dashed border-gray-300 rounded-xl text-xs text-[#6B7280]">
                    No monthly metrics match the active filter or search query.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ACTION PLAN REGISTRY */}
        {activeTab === 'actions' && (
          <ActionPlanTable
            actionItems={currentActionItems}
            onUpdateActionItem={updateActionItem}
            onDeleteActionItem={deleteActionItem}
            onAddActionItem={addActionItem}
            userRole={state.currentUserRole}
            onAddAttachment={addActionItemAttachment}
            onDeleteAttachment={deleteActionItemAttachment}
          />
        )}

        {/* HOURS PLANNER */}
        {activeTab === 'hours' && (
          <HoursPlanner
            employees={currentEmployees}
            timeBookings={currentTimeBookings}
            actionItems={currentActionItems}
            onAddTimeBooking={addTimeBooking}
            onUpdateTimeBooking={updateTimeBooking}
            onDeleteTimeBooking={deleteTimeBooking}
          />
        )}

        {/* RESOURCE MASTER */}
        {activeTab === 'master' && (
          <ResourceMaster
            employees={currentEmployees}
            timeBookings={currentTimeBookings}
            onAddEmployee={addEmployee}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
          />
        )}

        {/* PROJECT TRACKING MATRIX */}
        {activeTab === 'matrix' && (
          <ProjectMatrixView
            projects={state.projectMatrices || []}
            activeProjectId={state.activeProjectId}
            employees={currentEmployees}
            onSelectProject={setActiveProjectId}
            onAddProject={addProjectMatrix}
            onUpdateProject={updateProjectMatrix}
            onDeleteProject={deleteProjectMatrix}
            onDuplicateProject={duplicateProjectMatrix}
            onAddPoint={addMatrixPoint}
            onUpdatePoint={updateMatrixPoint}
            onDeletePoint={deleteMatrixPoint}
            onDuplicatePoint={duplicateMatrixPoint}
            onAddSubPoint={addMatrixSubPoint}
            onUpdateSubPoint={updateMatrixSubPoint}
            onDeleteSubPoint={deleteMatrixSubPoint}
            onAddCustomCategory={addCustomMatrixCategory}
            onDeleteCustomCategory={deleteCustomMatrixCategory}
            onUpdateCustomCategory={updateCustomMatrixCategory}
            onNavigateToResourceMaster={() => setActiveTab('master')}
            onTogglePinPoint={togglePinPoint}
            onAddPointAttachment={addPointAttachment}
            onDeletePointAttachment={deletePointAttachment}
            onLoadLinkedOperations={loadLinkedOperationsFile}
          />
        )}

        {/* BACKUPS FACILITY */}
        {activeTab === 'backup' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <BackupPanel
              onExport={exportBackup}
              onImport={importBackup}
              onReset={resetToTemplate}
              onLoadLinkedOperations={loadLinkedOperationsFile}
            />

            <div className="bg-[#F7F8F9] border border-gray-200 p-5 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-[#262A2E] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <BookOpen className="w-4 h-4 text-[#E5AE00]" />
                Understanding Huddleboard Backup Operations
              </h4>
              <div className="text-xs text-[#4B5563] space-y-2 leading-relaxed">
                <p>
                  <strong>Portable Backups:</strong> Exporting a JSON backup preserves all 5-Why root cause diagrams, daily checklists, project matrices, and action plans in a single file.
                </p>
                <p>
                  <strong>Team Sharing:</strong> Export at the end of a shift stand-up so other coordinators can import and sync the board configuration immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="bg-[#F7F8F9] border-t border-gray-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B7280] shrink-0">
        <div className="font-mono">Built for continuous operational team excellence.</div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <span className="font-mono text-[10px] uppercase tracking-wide bg-white px-2.5 py-0.5 rounded text-[#4B5563] border border-gray-200">
            Epiroc SSQDCC Standard
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide bg-[#FFFBEB] px-2.5 py-0.5 rounded text-[#1F2328] border border-[#FFC20E]/50 font-bold">
            EPS Lean Process
          </span>
        </div>
      </footer>

      {/* EXCEL AUTO-SYNC MODAL */}
      {showExcelSyncModal && (
        <ExcelSyncModal
          widgets={state.widgets}
          onUpdateWidgetValue={updateWidgetValue}
          onClose={() => setShowExcelSyncModal(false)}
        />
      )}

      {/* 15-MINUTE HUDDLE RUNNER MODAL (Rendered before HuddleScribe so Scribe overlays cleanly) */}
      {showHuddleRunner && (
        <HuddleRunnerModal
          widgets={state.widgets}
          deviations={state.deviations}
          onUpdateWidgetValue={updateWidgetValue}
          onAddActionItem={addActionItem}
          onAddDeviation={addDeviation}
          onClose={() => setShowHuddleRunner(false)}
          onOpenScribe={() => setShowHuddleScribe(true)}
        />
      )}

      {/* AI AUTONOMOUS HUDDLE SCRIBE MODAL */}
      {showHuddleScribe && (
        <HuddleScribeModal
          isOpen={showHuddleScribe}
          onClose={() => setShowHuddleScribe(false)}
          widgets={currentWidgets}
          projects={state.projectMatrices || []}
          employees={currentEmployees}
          onUpdateWidgetValue={updateWidgetValue}
          onAddWidget={addWidget}
          onAddMetricToWeekly={addMetricToWeeklyAnalysis}
          onAddProject={addProjectMatrix}
          onAddActionItem={addActionItem}
          onUpdateSafetyCross={updateSafetyCross}
          onUpdateSafetyNote={updateSafetyNote}
        />
      )}

      {/* SHIFT STICKY NOTES MODAL */}
      {showStickyNotes && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
            <HuddleStickyNotesPanel
              notes={state.stickyNotes || []}
              onAddNote={addStickyNote}
              onUpdateNote={updateStickyNote}
              onDeleteNote={deleteStickyNote}
              currentUserRole={state.currentUserRole}
              onClose={() => setShowStickyNotes(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
