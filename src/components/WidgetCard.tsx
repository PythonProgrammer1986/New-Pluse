import React, { useState, useEffect } from 'react';
import { MetricWidget, Pillar, DataPoint, ProjectTrackRecord } from '../types';
import {
  Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat,
  Trash2, Edit, Check, Play, Pause, RotateCcw, Info, AlertTriangle,
  Plus, X, ArrowRight, FolderKanban, Pin
} from 'lucide-react';

interface WidgetCardProps {
  widget: MetricWidget;
  onUpdateValue: (id: string, updates: Partial<MetricWidget>) => void;
  onToggleChecklist: (widgetId: string, itemId: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
  onReorder?: (draggedId: string, targetId: string) => void;
  onNavigateToProjectMatrix?: () => void;
  projects?: ProjectTrackRecord[];
  onTogglePin?: (id: string) => void;
  isInWeeklyAnalysis?: boolean;
  onAddToWeeklyAnalysis?: (widgetId: string) => void;
  onRemoveFromWeeklyAnalysis?: (widgetId: string) => void;
  onNavigateToWeeklyAnalysis?: () => void;
}

export default function WidgetCard({
  widget,
  onUpdateValue,
  onToggleChecklist,
  onDelete,
  onReorder,
  onNavigateToProjectMatrix,
  projects,
  onTogglePin,
  isInWeeklyAnalysis = false,
  onAddToWeeklyAnalysis,
  onRemoveFromWeeklyAnalysis,
  onNavigateToWeeklyAnalysis
}: WidgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempActual, setTempActual] = useState(widget.actual?.toString() || '');
  const [tempTarget, setTempTarget] = useState(widget.target?.toString() || '');
  const [tempWarningThreshold, setTempWarningThreshold] = useState(widget.warningThreshold?.toString() || '');
  const [showInfo, setShowInfo] = useState(false);
  const [tempTitle, setTempTitle] = useState(widget.title);
  const [tempDesc, setTempDesc] = useState(widget.description || '');
  const [tempUnit, setTempUnit] = useState(widget.unit || '');
  const [tempOwner, setTempOwner] = useState(widget.owner || '');

  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (widget.type === 'stopwatch' && isTimerRunning) {
      interval = setInterval(() => {
        onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [widget.type, isTimerRunning, widget.actual, widget.id, onUpdateValue]);

  const getPillarConfig = (pillar: Pillar) => {
    switch (pillar) {
      case 'Safety':
        return { icon: Shield, iconColor: 'text-rose-600' };
      case 'Sustainability':
        return { icon: Leaf, iconColor: 'text-emerald-600' };
      case 'Quality':
        return { icon: CheckCircle, iconColor: 'text-[#262A2E]' };
      case 'Delivery':
        return { icon: TrendingUp, iconColor: 'text-amber-600' };
      case 'Cost':
        return { icon: Coins, iconColor: 'text-[#4B5563]' };
      case 'Capital':
        return { icon: HardHat, iconColor: 'text-[#262A2E]' };
    }
  };

  const config = getPillarConfig(widget.pillar);
  const IconComponent = config.icon;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const actualNum = parseFloat(tempActual);
    const targetNum = parseFloat(tempTarget);
    const warningNum = parseFloat(tempWarningThreshold);

    onUpdateValue(widget.id, {
      title: tempTitle,
      description: tempDesc || undefined,
      unit: tempUnit || undefined,
      owner: tempOwner || undefined,
      ...(!isNaN(actualNum) ? { actual: actualNum } : {}),
      ...(!isNaN(targetNum) ? { target: targetNum } : {}),
      ...(!isNaN(warningNum) ? { warningThreshold: warningNum } : {})
    });
    setIsEditing(false);
  };

  const handleIncrementDefect = (index: number, delta: number = 1) => {
    if (widget.dataPoints) {
      const updatedDataPoints = [...widget.dataPoints];
      const newCount = Math.max(0, updatedDataPoints[index].value + delta);
      updatedDataPoints[index] = {
        ...updatedDataPoints[index],
        value: newCount
      };
      const sum = updatedDataPoints.reduce((acc, curr) => acc + curr.value, 0);
      onUpdateValue(widget.id, {
        dataPoints: updatedDataPoints,
        actual: sum
      });
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    if (widget.milestones) {
      const updated = widget.milestones.map(m => {
        if (m.id === milestoneId) {
          const nextStatus: 'pending' | 'active' | 'completed' =
            m.status === 'completed' ? 'active' : m.status === 'active' ? 'pending' : 'completed';
          return { ...m, status: nextStatus };
        }
        return m;
      });

      const hasPendingOverdue = updated.some(m => m.status === 'pending');
      onUpdateValue(widget.id, {
        milestones: updated,
        state: hasPendingOverdue ? 'red' : 'green'
      });
    }
  };

  const isExceedingWarning =
    widget.actual !== undefined &&
    widget.target !== undefined &&
    widget.warningThreshold !== undefined &&
    widget.target > 0 &&
    widget.actual > widget.target * (widget.warningThreshold / 100);

  const skillsData = widget.dataPoints || [
    { label: 'Operator A', value: 3, target: 4 },
    { label: 'Operator B', value: 2, target: 4 },
    { label: 'Operator C', value: 4, target: 4 }
  ];

  const kanbanData = widget.milestones || [
    { id: 'kb-1', name: 'Tool Cart 5S Layout', status: 'pending' as const, owner: 'Operator A', dueDate: '2026-10-10' },
    { id: 'kb-2', name: 'LED Takt Signal Indicator', status: 'active' as const, owner: 'Team Lead', dueDate: '2026-10-12' },
    { id: 'kb-3', name: 'LOTO Safety Box Upgrade', status: 'completed' as const, owner: 'EHS Engineer', dueDate: '2026-10-15' }
  ];

  const radarData = widget.dataPoints || [
    { label: 'Sort (Seiri)', value: 90, target: 100 },
    { label: 'Set in Order (Seiton)', value: 85, target: 100 },
    { label: 'Shine (Seiso)', value: 95, target: 100 },
    { label: 'Standardize (Seiketsu)', value: 80, target: 100 },
    { label: 'Sustain (Shitsuke)', value: 85, target: 100 }
  ];

  const paretoData = widget.dataPoints || [
    { label: 'Startup Loss', value: 35, target: 10 },
    { label: 'Tool Defect', value: 25, target: 10 },
    { label: 'Operator Error', value: 15, target: 5 }
  ];

  const countdownData = widget.milestones || [
    { id: 'cd-1', name: '1. Material Loading', status: 'completed' as const, owner: 'Logistics', dueDate: '2026-10-05' },
    { id: 'cd-2', name: '2. Sub-Assembly', status: 'completed' as const, owner: 'Assembly', dueDate: '2026-10-05' },
    { id: 'cd-3', name: '3. QA Test Run', status: 'active' as const, owner: 'QA Inspector', dueDate: '2026-10-06' },
    { id: 'cd-4', name: '4. Final Dispatch', status: 'pending' as const, owner: 'Shipping', dueDate: '2026-10-07' }
  ];

  const heatmapData =
    widget.dataPoints ||
    Array.from({ length: 24 }).map((_, idx) => ({
      label: `${idx}:00`,
      value: 0
    }));

  const defaultOwner =
    widget.pillar === 'Safety'
      ? 'EHS Lead'
      : widget.pillar === 'Quality'
      ? 'Quality Lead'
      : widget.pillar === 'Delivery'
      ? 'Production Planner'
      : widget.pillar === 'Cost'
      ? 'Cost Lead'
      : widget.pillar === 'Sustainability'
      ? 'EHS Champion'
      : 'Team Lead';

  return (
    <div
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', widget.id);
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== widget.id && onReorder) {
          onReorder(draggedId, widget.id);
        }
      }}
      className={`relative bg-white border rounded-xl shadow-xs transition-all duration-200 overflow-hidden flex flex-col h-full cursor-grab active:cursor-grabbing ${
        isExceedingWarning
          ? 'border-rose-500 ring-2 ring-rose-200'
          : widget.state === 'red'
          ? 'border-rose-300 ring-1 ring-rose-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-[#F7F8F9] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[#262A2E] text-[13px] truncate" title={widget.title}>
              {widget.title}
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-mono">
              <span className="uppercase font-semibold">Owner:</span>
              <span className="font-bold text-[#3A3F45] truncate" title={widget.owner || 'Operational Champion'}>
                {widget.owner || defaultOwner}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {widget.linkedWidgetId && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Auto-synchronizing values with connected huddleboard widget"
            >
              Synced
            </span>
          )}

          {/* Semantic KPI Status */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              widget.state === 'red'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {widget.state === 'red' ? 'Deviation' : 'On Target'}
          </span>

          {widget.state === 'red' &&
            (isInWeeklyAnalysis ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemoveFromWeeklyAnalysis) onRemoveFromWeeklyAnalysis(widget.id);
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#FFFBEB] text-[#1F2328] border border-[#FFC20E] flex items-center gap-1 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer group font-mono"
                title="In Weekly Analysis. Click to remove."
              >
                <Check className="w-2.5 h-2.5 group-hover:hidden text-[#D97706]" />
                <X className="w-2.5 h-2.5 hidden group-hover:block text-rose-600" />
                <span className="group-hover:hidden">Weekly</span>
                <span className="hidden group-hover:inline">Remove</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAddToWeeklyAnalysis) onAddToWeeklyAnalysis(widget.id);
                }}
                className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] flex items-center gap-1 cursor-pointer transition-colors font-mono"
                title="Add this deviation to Weekly Analysis"
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
                <span>Weekly</span>
              </button>
            ))}

          {isExceedingWarning && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white"
              title={`Drift warning: Actual exceeded ${widget.warningThreshold}% of Target`}
            >
              DRIFT
            </span>
          )}

          {onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(widget.id)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                widget.pinned
                  ? 'text-[#1F2328] bg-[#FFC20E]'
                  : 'text-[#6B7280] hover:text-[#262A2E] hover:bg-gray-200/70'
              }`}
              title={widget.pinned ? 'Unpin from Top Focus' : 'Pin to Top Focus'}
            >
              <Pin className={`w-3.5 h-3.5 ${widget.pinned ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 hover:bg-gray-200/70 rounded-md text-[#6B7280] hover:text-[#262A2E] transition-colors cursor-pointer"
            title="Toggle Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setTempTitle(widget.title);
              setTempDesc(widget.description || '');
              setTempUnit(widget.unit || '');
              setTempOwner(widget.owner || '');
              setTempActual(widget.actual?.toString() || '');
              setTempTarget(widget.target?.toString() || '');
              setTempWarningThreshold(widget.warningThreshold?.toString() || '');
              setIsEditing(!isEditing);
            }}
            className="p-1 hover:bg-gray-200/70 rounded-md text-[#6B7280] hover:text-[#262A2E] transition-colors cursor-pointer"
            title="Edit Metric"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(widget.id)}
            className="p-1 hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
            title="Remove Widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info overlay */}
      {showInfo && widget.description && (
        <div className="bg-[#F7F8F9] px-4 py-2.5 text-xs text-[#4B5563] border-b border-gray-200 leading-relaxed">
          {widget.description}
        </div>
      )}

      {/* Edit Overlay Form */}
      {isEditing && (
        <div className="bg-[#F7F8F9] p-4 border-b border-gray-200 space-y-4 animate-fade-in">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                  KPI Title
                </label>
                <input
                  type="text"
                  required
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                  Metric Owner
                </label>
                <input
                  type="text"
                  value={tempOwner}
                  onChange={(e) => setTempOwner(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                  Description
                </label>
                <input
                  type="text"
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  placeholder="Brief tracking context..."
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                  Unit Symbol
                </label>
                <input
                  type="text"
                  value={tempUnit}
                  onChange={(e) => setTempUnit(e.target.value)}
                  placeholder="e.g. % or min"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                {widget.actual !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                      Actual
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tempActual}
                      onChange={(e) => setTempActual(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                    />
                  </div>
                )}
                {widget.target !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                      Target
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tempTarget}
                      onChange={(e) => setTempTarget(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                    />
                  </div>
                )}
                {widget.warningThreshold !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-0.5">
                      Warn (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tempWarningThreshold}
                      onChange={(e) => setTempWarningThreshold(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                      placeholder="110"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-[#3A3F45] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {widget.type === 'checklist' && widget.checklist && (
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">
                Modify Checklist Steps
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {widget.checklist.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const updated = [...widget.checklist!];
                        updated[idx] = { ...item, label: e.target.value };
                        onUpdateValue(widget.id, { checklist: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 bg-white rounded-lg text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = widget.checklist!.filter((c) => c.id !== item.id);
                        onUpdateValue(widget.id, { checklist: updated });
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [
                    ...(widget.checklist || []),
                    { id: `item-${Date.now()}`, label: 'New Checkpoint Task', checked: false }
                  ];
                  onUpdateValue(widget.id, { checklist: updated, state: 'red' });
                }}
                className="w-full py-1.5 text-xs font-bold text-[#1F2328] bg-[#FFC20E] hover:bg-[#E5AE00] rounded-lg transition-colors cursor-pointer"
              >
                + Add Checkpoint
              </button>
            </div>
          )}

          {['chart', 'radar', 'pareto', 'skills', 'heatmap'].includes(widget.type) && (
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">
                Modify Categories & Sub-items
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(
                  widget.dataPoints ||
                  (widget.type === 'skills'
                    ? skillsData
                    : widget.type === 'radar'
                    ? radarData
                    : widget.type === 'pareto'
                    ? paretoData
                    : widget.type === 'heatmap'
                    ? heatmapData
                    : [])
                ).map((dpItem, idx) => {
                  const dp = dpItem as DataPoint;
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <input
                        type="text"
                        value={dp.label}
                        onChange={(e) => {
                          const currentList = [...(widget.dataPoints || skillsData)];
                          currentList[idx] = { ...dp, label: e.target.value };
                          onUpdateValue(widget.id, { dataPoints: currentList });
                        }}
                        className="col-span-5 px-2 py-1 text-xs border border-gray-300 bg-white rounded-lg text-[#262A2E]"
                        placeholder="Item Label"
                      />
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={dp.value}
                          onChange={(e) => {
                            const currentList = [...(widget.dataPoints || skillsData)];
                            currentList[idx] = { ...dp, value: parseFloat(e.target.value) || 0 };
                            const sum = currentList.reduce((acc, curr) => acc + curr.value, 0);
                            onUpdateValue(widget.id, { dataPoints: currentList, actual: sum });
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 bg-white rounded-lg font-mono text-[#262A2E] text-center"
                          placeholder="Val"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={dp.target !== undefined ? dp.target : ''}
                          onChange={(e) => {
                            const currentList = [...(widget.dataPoints || skillsData)];
                            const num = parseFloat(e.target.value);
                            currentList[idx] = { ...dp, target: isNaN(num) ? undefined : num };
                            onUpdateValue(widget.id, { dataPoints: currentList });
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 bg-white rounded-lg text-[#262A2E] text-center font-mono"
                          placeholder="Target"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentList = (widget.dataPoints || skillsData).filter((_, i) => i !== idx);
                          const sum = currentList.reduce((acc, curr) => acc + curr.value, 0);
                          onUpdateValue(widget.id, { dataPoints: currentList, actual: sum });
                        }}
                        className="col-span-1 p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer flex items-center justify-center"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentList = [
                    ...(widget.dataPoints || skillsData),
                    { label: 'New Category Item', value: 0, target: 100 }
                  ];
                  onUpdateValue(widget.id, { dataPoints: currentList });
                }}
                className="w-full py-1.5 text-xs font-bold text-[#1F2328] bg-[#FFC20E] hover:bg-[#E5AE00] rounded-lg transition-colors cursor-pointer"
              >
                + Add Sub-item
              </button>
            </div>
          )}

          {['project', 'kanban', 'countdown'].includes(widget.type) && (
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">
                Modify Milestones & Cards
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(
                  widget.milestones ||
                  (widget.type === 'kanban'
                    ? kanbanData
                    : widget.type === 'countdown'
                    ? countdownData
                    : [])
                ).map((m, idx) => (
                  <div key={m.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const currentList = [...(widget.milestones || kanbanData)];
                        currentList[idx] = { ...m, name: e.target.value };
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-5 px-2 py-1.5 text-[11px] border border-gray-300 bg-white rounded-lg text-[#262A2E]"
                      placeholder="Milestone"
                    />
                    <select
                      value={m.status}
                      onChange={(e) => {
                        const currentList = [...(widget.milestones || kanbanData)];
                        currentList[idx] = { ...m, status: e.target.value as any };
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-3 px-1 py-1.5 text-[10px] border border-gray-300 bg-white rounded-lg text-[#262A2E] font-mono"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Done</option>
                    </select>
                    <input
                      type="text"
                      value={m.owner}
                      onChange={(e) => {
                        const currentList = [...(widget.milestones || kanbanData)];
                        currentList[idx] = { ...m, owner: e.target.value };
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-3 px-2 py-1.5 text-[11px] border border-gray-300 bg-white rounded-lg text-[#262A2E]"
                      placeholder="Owner"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentList = (widget.milestones || kanbanData).filter((ms) => ms.id !== m.id);
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-1 p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer flex items-center justify-center"
                      title="Remove milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentList = [
                    ...(widget.milestones || kanbanData),
                    {
                      id: `m-${Date.now()}`,
                      name: 'New Item Card',
                      status: 'pending' as const,
                      owner: 'Staff',
                      dueDate: new Date().toISOString().split('T')[0]
                    }
                  ];
                  onUpdateValue(widget.id, { milestones: currentList, state: 'red' });
                }}
                className="w-full py-1.5 text-xs font-bold text-[#1F2328] bg-[#FFC20E] hover:bg-[#E5AE00] rounded-lg transition-colors cursor-pointer"
              >
                + Add Milestone Card
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        {widget.type === 'counter' && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { value: Math.max(0, (widget.value || 0) - 1) })}
                className="px-2.5 py-1 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded-lg text-xs font-bold cursor-pointer select-none transition-colors"
                title="Decrement"
              >
                -1
              </button>
              <span className="text-4xl font-extrabold font-mono tracking-tight text-[#262A2E] tabular-nums">
                {widget.value || 0}
              </span>
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { value: (widget.value || 0) + 1 })}
                className="px-2.5 py-1 bg-[#F3F4F6] hover:bg-[#FFC20E] text-[#262A2E] rounded-lg text-xs font-bold cursor-pointer select-none transition-colors"
                title="Increment"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { value: 0 })}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors font-mono"
                title="Reset Counter to 0"
              >
                Reset
              </button>
            </div>
            <span className="text-xs text-[#6B7280] block mt-1.5">consecutive days completed</span>
          </div>
        )}

        {widget.type === 'numeric' && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-[#6B7280] block font-medium">Actual Today</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-[#262A2E] tabular-nums">
                    {widget.actual ?? 0}{' '}
                    <span className="text-sm font-normal text-[#6B7280]">{widget.unit}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 1) })}
                      className="w-6 h-6 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded text-xs font-black cursor-pointer transition-colors flex items-center justify-center"
                      title="Decrement (-1)"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 })}
                      className="w-6 h-6 bg-[#F3F4F6] hover:bg-[#FFC20E] text-[#262A2E] rounded text-xs font-black cursor-pointer transition-colors flex items-center justify-center"
                      title="Increment (+1)"
                    >
                      +
                    </button>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#6B7280] block font-medium">Target</span>
                <span className="text-sm font-bold font-mono text-[#3A3F45] tabular-nums">
                  {widget.target ?? 0} {widget.unit}
                </span>
              </div>
            </div>

            {widget.target !== undefined && widget.actual !== undefined && (
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    widget.state === 'red' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(5, widget.target > 0 ? (widget.actual / widget.target) * 100 : widget.actual === 0 ? 100 : 100)
                    )}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        )}

        {widget.type === 'checklist' && widget.checklist && (
          <div className="space-y-1.5">
            {widget.checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2.5 p-1.5 hover:bg-[#F7F8F9] rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleChecklist(widget.id, item.id)}
                  className="mt-0.5 w-4 h-4 accent-[#FFC20E] rounded border-gray-300 cursor-pointer"
                />
                <span
                  className={`text-[12px] leading-tight select-none transition-all ${
                    item.checked ? 'text-[#9CA3AF] line-through' : 'text-[#262A2E] font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {widget.type === 'gauge' && (
          <div className="flex flex-col items-center justify-center py-1 space-y-2.5">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={widget.state === 'red' ? '#DC2626' : '#10B981'}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(100, Math.max(0, widget.actual || 0)) / 100)}`}
                  className="transition-all duration-300 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-bold font-mono text-[#262A2E] tabular-nums">
                  {widget.actual || 0}%
                </span>
                <span className="text-[9px] text-[#6B7280] font-medium">Target {widget.target || 100}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 5) })}
                className="px-2 py-0.5 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded text-[10px] font-bold cursor-pointer font-mono"
              >
                -5%
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={widget.actual || 0}
                onChange={(e) => onUpdateValue(widget.id, { actual: parseFloat(e.target.value) })}
                className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FFC20E]"
              />
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { actual: Math.min(100, (widget.actual || 0) + 5) })}
                className="px-2 py-0.5 bg-[#F3F4F6] hover:bg-[#FFC20E] text-[#262A2E] rounded text-[10px] font-bold cursor-pointer font-mono"
              >
                +5%
              </button>
            </div>
          </div>
        )}

        {widget.type === 'chart' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Categories (Click -/+ to Adjust):
            </span>
            <div className="space-y-1.5">
              {(
                widget.dataPoints || [
                  { label: 'Surface Scratches', value: 3, target: 1 },
                  { label: 'Dimensional Deviations', value: 2, target: 1 }
                ]
              ).map((dp, idx) => (
                <div
                  key={dp.label}
                  className="flex flex-col p-2 bg-[#F7F8F9] rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#262A2E] font-semibold">{dp.label}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleIncrementDefect(idx, -1)}
                        className="w-5 h-5 bg-white border border-gray-300 text-[#3A3F45] rounded flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-[#262A2E] tabular-nums px-1">
                        {dp.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrementDefect(idx, 1)}
                        className="w-5 h-5 bg-white border border-gray-300 text-[#3A3F45] rounded flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-[#FFC20E] hover:border-[#FFC20E]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dp.value > (dp.target || 0) ? 'bg-rose-500' : 'bg-[#3A3F45]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, (dp.value / 10) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {widget.type === 'project' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
              Milestones (Click to Toggle):
            </span>
            <div className="space-y-1.5">
              {(
                widget.milestones || [
                  {
                    id: 'm-1',
                    name: 'Draft Design and Engineering Plan',
                    status: 'completed' as const,
                    owner: 'Team Lead',
                    dueDate: '2026-10-01'
                  },
                  {
                    id: 'm-2',
                    name: 'Tooling installation & dry run',
                    status: 'active' as const,
                    owner: 'Maintenance',
                    dueDate: '2026-10-05'
                  }
                ]
              ).map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleMilestone(m.id)}
                  className="flex items-center justify-between p-2 bg-[#F7F8F9] border border-gray-200 rounded-lg cursor-pointer hover:border-[#FFC20E] transition-colors"
                  title={`Owner: ${m.owner} · Due: ${m.dueDate} · Click to cycle status`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        m.status === 'completed'
                          ? 'bg-emerald-500'
                          : m.status === 'active'
                          ? 'bg-[#FFC20E]'
                          : 'bg-gray-300'
                      }`}
                    ></div>
                    <span className="text-[11px] font-semibold text-[#262A2E] truncate">{m.name}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase bg-white px-2 py-0.5 rounded border border-gray-200 text-[#4B5563] shrink-0">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {widget.type === 'stopwatch' && (
          <div className="text-center bg-[#F7F8F9] p-3.5 rounded-xl border border-gray-200 space-y-2">
            <span
              className={`text-3xl font-black font-mono tracking-tight tabular-nums block ${
                widget.actual && widget.actual > (widget.target || 45) ? 'text-rose-600' : 'text-[#262A2E]'
              }`}
            >
              {Math.floor((widget.actual || 0) / 60).toString().padStart(2, '0')}:
              {((widget.actual || 0) % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-[#6B7280] font-semibold block uppercase font-mono">
              Target: {widget.target || 45}s Cycle Time
            </span>

            <div className="flex justify-center items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                  isTimerRunning
                    ? 'bg-[#FFC20E] text-[#1F2328]'
                    : 'bg-[#262A2E] hover:bg-[#3A3F45] text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  onUpdateValue(widget.id, { actual: 0 });
                }}
                className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-[#3A3F45] rounded-lg text-xs font-bold cursor-pointer font-mono flex items-center gap-1"
                title="Reset timer to 0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {widget.type === 'heatmap' && (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider font-mono">
                Hourly Machine State:
              </span>
              <button
                type="button"
                onClick={() => {
                  const resetList = heatmapData.map((h) => ({ ...h, value: 0 }));
                  onUpdateValue(widget.id, { dataPoints: resetList });
                }}
                className="text-[9px] font-mono text-[#6B7280] hover:text-rose-600 underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {heatmapData.map((hp, i) => {
                const val = hp.value || 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const updated = [...heatmapData];
                      updated[i] = { ...hp, value: (val + 1) % 4 };
                      onUpdateValue(widget.id, { dataPoints: updated });
                    }}
                    className={`h-5 rounded border text-[9px] font-mono font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                      val === 0
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : val === 1
                        ? 'bg-[#FFC20E] border-[#E5AE00] text-[#1F2328]'
                        : val === 2
                        ? 'bg-rose-500 border-rose-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-[#6B7280]'
                    }`}
                    title={`Hour ${i}:00 - Click to cycle`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-[#6B7280] font-medium font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Running
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FFC20E] inline-block"></span>Idle
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>Down
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>Off
              </span>
            </div>
          </div>
        )}

        {widget.type === 'pareto' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">
              Scrap Distribution:
            </span>
            {paretoData.map((item, idx) => (
              <div key={item.label} className="space-y-1 bg-[#F7F8F9] p-2 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#262A2E]">
                  <span>{item.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...paretoData];
                        updated[idx] = { ...item, value: Math.max(0, item.value - 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-5 h-5 bg-white border border-gray-300 text-[#3A3F45] rounded font-bold text-[10px] flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-rose-600 font-bold px-1">{item.value}%</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...paretoData];
                        updated[idx] = { ...item, value: Math.min(100, item.value + 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-5 h-5 bg-white border border-gray-300 text-[#3A3F45] rounded font-bold text-[10px] flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, item.value)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {widget.type === 'skills' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">
              Team Skill Matrix (Click to set level):
            </span>
            {skillsData.map((p, pIdx) => (
              <div
                key={p.label}
                className="flex items-center justify-between text-[11px] p-2 bg-[#F7F8F9] rounded-lg border border-gray-200"
              >
                <div>
                  <span className="font-bold text-[#262A2E] block">{p.label}</span>
                  <span className="text-[9px] text-[#6B7280] block font-mono">
                    {p.target || 'General Competency'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => {
                        const updated = [...skillsData];
                        updated[pIdx] = { ...p, value: starVal };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        starVal <= p.value
                          ? 'bg-[#FFC20E] text-[#1F2328]'
                          : 'bg-white border border-gray-300 text-[#9CA3AF]'
                      }`}
                      title={`Set Level ${starVal}/4`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {widget.type === 'kanban' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">
              Suggestions (Click card to advance):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'To Do', key: 'pending' },
                { label: 'Testing', key: 'active' },
                { label: 'Done', key: 'completed' }
              ].map((col) => {
                const cards = kanbanData.filter((c) => c.status === col.key);
                return (
                  <div
                    key={col.key}
                    className="p-2 bg-[#F7F8F9] border border-gray-200 rounded-lg space-y-1.5 min-h-[80px]"
                  >
                    <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block font-mono border-b border-gray-200 pb-1">
                      {col.label} ({cards.length})
                    </span>
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => toggleMilestone(card.id)}
                        className="p-1.5 bg-white border border-gray-200 rounded text-[10px] font-semibold text-[#262A2E] shadow-2xs cursor-pointer hover:border-[#FFC20E] transition-colors leading-tight"
                        title="Click to advance status"
                      >
                        {card.name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {widget.type === 'handover' && (
          <div className="p-3 bg-[#F7F8F9] rounded-xl border border-gray-200 text-center space-y-3">
            <div className="space-y-0.5">
              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">
                Shift Transition Status
              </span>
              <span className="text-xs text-[#262A2E] block font-bold font-mono">Shift A → Shift B</span>
            </div>

            <button
              type="button"
              onClick={() => onUpdateValue(widget.id, { state: widget.state === 'green' ? 'red' : 'green' })}
              className={`w-full py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors font-mono ${
                widget.state === 'green'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328]'
              }`}
            >
              {widget.state === 'green' ? '✓ Shift Handover Signed' : 'Awaiting Signoff'}
            </button>

            <textarea
              rows={2}
              value={widget.description || ''}
              onChange={(e) => onUpdateValue(widget.id, { description: e.target.value })}
              placeholder="Type supervisor handover notes here..."
              className="w-full text-xs p-2 border border-gray-300 bg-white rounded-lg text-[#262A2E] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
            />
          </div>
        )}

        {widget.type === 'riskGauge' && (
          <div className="space-y-2.5 py-1 text-center">
            <div className="relative w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '30%' }}></div>
              <div className="bg-[#FFC20E] h-full" style={{ width: '40%' }}></div>
              <div className="bg-rose-500 h-full" style={{ width: '30%' }}></div>
              <div
                className="absolute top-0 bottom-0 w-1.5 bg-[#262A2E] transition-all duration-300 shadow"
                style={{ left: `${Math.min(98, Math.max(0, widget.actual || 25))}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono pt-1">
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 5) })}
                className="px-2 py-0.5 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded font-bold cursor-pointer"
              >
                -5 Risk
              </button>
              <span className="font-bold text-[#262A2E]">LOTO Index: {widget.actual || 0} / 100</span>
              <button
                type="button"
                onClick={() => onUpdateValue(widget.id, { actual: Math.min(100, (widget.actual || 0) + 5) })}
                className="px-2 py-0.5 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded font-bold cursor-pointer"
              >
                +5 Risk
              </button>
            </div>
          </div>
        )}

        {widget.type === 'emission' && (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#4B5563]">Carbon Footprint:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 5) })}
                  className="px-1.5 py-0.5 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded text-[10px] font-bold cursor-pointer"
                >
                  -5
                </button>
                <span className="font-bold text-emerald-700 text-sm">
                  {widget.actual || 0} {widget.unit || 'kg'}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 5 })}
                  className="px-1.5 py-0.5 bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] rounded text-[10px] font-bold cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>
            <div className="w-full bg-[#F7F8F9] border border-gray-200 h-11 rounded-lg overflow-hidden flex items-end relative p-1.5">
              <div className="absolute top-0.5 right-1.5 text-[8px] font-mono text-[#6B7280]">
                Target: {widget.target || 150} {widget.unit || 'kg'}
              </div>
              <div className="w-full flex items-end justify-between h-6 gap-0.5">
                {[30, 45, 60, 55, 75, 90, 85, 110, widget.actual || 120].map((hVal, hIdx) => (
                  <div
                    key={hIdx}
                    className={`w-full rounded-t-xs transition-all duration-300 ${
                      hVal > (widget.target || 150) ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ height: `${Math.min(100, Math.max(8, (hVal / (widget.target || 150)) * 100))}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {widget.type === 'radar' && (
          <div className="space-y-1.5 py-1">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">
              5S Audit Scorecard:
            </span>
            {radarData.map((category, idx) => (
              <div key={category.label} className="space-y-1 bg-[#F7F8F9] p-1.5 rounded-lg border border-gray-200">
                <div className="flex justify-between text-[10px] font-semibold text-[#262A2E]">
                  <span>{category.label}</span>
                  <div className="flex items-center gap-1 font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...radarData];
                        updated[idx] = { ...category, value: Math.max(0, category.value - 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-4 h-4 bg-white border border-gray-300 text-[#3A3F45] rounded font-bold text-[9px] flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-[#262A2E] px-1 font-bold">{category.value}/100</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...radarData];
                        updated[idx] = { ...category, value: Math.min(100, category.value + 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-4 h-4 bg-white border border-gray-300 text-[#3A3F45] rounded font-bold text-[9px] flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${category.value >= 85 ? 'bg-emerald-500' : 'bg-[#FFC20E]'}`}
                    style={{ width: `${Math.min(100, category.value)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {widget.type === 'countdown' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-[#6B7280] font-bold block uppercase tracking-wider font-mono">
              Pipeline Stages (Click to toggle):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {countdownData.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => toggleMilestone(stage.id)}
                  className={`p-1.5 rounded-lg border text-[9px] font-bold font-mono uppercase cursor-pointer text-center transition-colors ${
                    stage.status === 'completed'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : stage.status === 'active'
                      ? 'bg-[#FFFBEB] border-[#FFC20E] text-[#1F2328]'
                      : 'bg-[#F7F8F9] border-gray-200 text-[#6B7280]'
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {widget.type === 'pulse' && (
          <div className="p-3 bg-[#F7F8F9] rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-[#6B7280] font-bold block uppercase font-mono">
                Takt Pace Index
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#262A2E] font-mono">
                  Actual: {widget.actual ?? 80} vs Target: {widget.target ?? 80}
                </span>
                <div className="flex items-center gap-1 font-mono">
                  <button
                    type="button"
                    onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 1) })}
                    className="px-1.5 py-0.5 bg-white border border-gray-300 text-[#3A3F45] rounded text-[10px] font-bold cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 })}
                    className="px-1.5 py-0.5 bg-white border border-gray-300 text-[#3A3F45] rounded text-[10px] font-bold cursor-pointer"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex h-6 w-6 items-center justify-center shrink-0">
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                  widget.state === 'red' ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              ></span>
            </div>
          </div>
        )}

        {widget.type === 'projectMatrix' && (
          <div className="space-y-3 py-1">
            {(() => {
              const matchedProject =
                (projects || []).find((p) => p.id === widget.projectId) ||
                (projects || []).find((p) => p.name.toLowerCase() === widget.title.toLowerCase()) ||
                (projects || [])[0];
              const points = matchedProject?.points || [];
              const totalPoints = points.length;
              const totalProgress =
                totalPoints > 0
                  ? Math.round(points.reduce((acc, p) => acc + (p.progressPercent || 0), 0) / totalPoints)
                  : 0;

              const totalBudget = points.reduce((acc, p) => acc + (p.budget || 0), 0);
              const totalActual = points.reduce((acc, p) => acc + (p.costActual || 0), 0);
              const availableCost = totalBudget - totalActual;
              const projectEndDate = matchedProject?.targetLaunchDate || 'N/A';

              return (
                <div className="p-3.5 bg-[#F7F8F9] rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban className="w-4 h-4 text-[#262A2E] shrink-0" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#262A2E] truncate">
                        {matchedProject ? matchedProject.code : 'EPI-PRJ'} Matrix
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateValue(widget.id, { state: widget.state === 'green' ? 'red' : 'green' })
                      }
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border cursor-pointer transition-colors shrink-0 ${
                        widget.state === 'green'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Click to toggle health status"
                    >
                      {widget.state === 'green' ? 'On Track' : 'At Risk'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#6B7280]">Completion</span>
                      <span className="text-[#262A2E] font-bold">{totalProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FFC20E] h-full rounded-full transition-all"
                        style={{ width: `${totalProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[#6B7280] block text-[9px] uppercase font-bold">Remaining Budget</span>
                      <span className={`font-bold ${availableCost >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {availableCost >= 0
                          ? `₹${availableCost.toLocaleString()}`
                          : `-₹${Math.abs(availableCost).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-[#6B7280] block text-[9px] uppercase font-bold">Target Date</span>
                      <span className="text-[#262A2E] font-bold">{projectEndDate}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToProjectMatrix?.()}
                    className="w-full py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                  >
                    <span>Open Project Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer Deviation Bar */}
      {widget.state === 'red' && (
        <div className="bg-rose-50 px-3.5 py-2.5 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-rose-700 font-semibold min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span className="text-[11px] font-bold truncate">Deviation Identified</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInWeeklyAnalysis ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFFBEB] text-[#1F2328] border border-[#FFC20E] font-mono flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#D97706]" />
                  <span>In Weekly</span>
                </span>
                {onNavigateToWeeklyAnalysis && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToWeeklyAnalysis();
                    }}
                    className="px-2 py-0.5 bg-[#262A2E] hover:bg-[#3A3F45] text-[#FFC20E] text-[10px] font-bold rounded cursor-pointer uppercase tracking-wider transition-colors flex items-center gap-1 font-mono"
                    title="Jump to Weekly Stand-up view"
                  >
                    <span>View</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromWeeklyAnalysis?.(widget.id);
                  }}
                  className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-100 rounded cursor-pointer transition-colors"
                  title="Remove from Weekly Analysis"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWeeklyAnalysis?.(widget.id);
                }}
                className="px-2.5 py-1 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-[10px] font-extrabold rounded cursor-pointer transition-colors flex items-center gap-1 uppercase tracking-wider font-mono"
                title="Add this deviation to Weekly Analysis"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Add to Weekly</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
