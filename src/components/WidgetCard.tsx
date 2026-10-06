import React, { useState, useEffect } from 'react';
import { MetricWidget, Pillar, DataPoint } from '../types';
import { 
  Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat, 
  Trash2, Edit, Check, Play, Pause, RotateCcw, Info, AlertTriangle, 
  Plus, Star, Layers, Clock, Sliders, X
} from 'lucide-react';

interface WidgetCardProps {
  widget: MetricWidget;
  onUpdateValue: (id: string, updates: Partial<MetricWidget>) => void;
  onToggleChecklist: (widgetId: string, itemId: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
  onReorder?: (draggedId: string, targetId: string) => void;
}

export default function WidgetCard({
  widget,
  onUpdateValue,
  onToggleChecklist,
  onDelete,
  userRole,
  onReorder,
}: WidgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempActual, setTempActual] = useState(widget.actual?.toString() || '');
  const [tempTarget, setTempTarget] = useState(widget.target?.toString() || '');
  const [tempWarningThreshold, setTempWarningThreshold] = useState(widget.warningThreshold?.toString() || '');
  const [showInfo, setShowInfo] = useState(false);
  const [tempTitle, setTempTitle] = useState(widget.title);
  const [tempDesc, setTempDesc] = useState(widget.description || '');
  const [tempUnit, setTempUnit] = useState(widget.unit || '');

  // Timer state for stopwatch type
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (widget.type === 'stopwatch' && isTimerRunning) {
      interval = setInterval(() => {
        onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [widget.type, isTimerRunning, widget.actual, widget.id]);

  // Pillar icon and colors
  const getPillarConfig = (pillar: Pillar) => {
    switch (pillar) {
      case 'Safety':
        return {
          icon: Shield,
          themeColor: 'text-rose-600 dark:text-rose-400',
          borderColor: 'border-rose-100 dark:border-rose-950/40',
          headerBg: 'bg-rose-50/50 dark:bg-rose-950/20',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        };
      case 'Sustainability':
        return {
          icon: Leaf,
          themeColor: 'text-emerald-600 dark:text-emerald-400',
          borderColor: 'border-emerald-100 dark:border-emerald-950/40',
          headerBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
        };
      case 'Quality':
        return {
          icon: CheckCircle,
          themeColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-100 dark:border-blue-950/40',
          headerBg: 'bg-blue-50/50 dark:bg-blue-950/20',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
        };
      case 'Delivery':
        return {
          icon: TrendingUp,
          themeColor: 'text-amber-600 dark:text-amber-400',
          borderColor: 'border-amber-100 dark:border-amber-950/40',
          headerBg: 'bg-amber-50/50 dark:bg-amber-950/20',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
        };
      case 'Cost':
        return {
          icon: Coins,
          themeColor: 'text-indigo-600 dark:text-indigo-400',
          borderColor: 'border-indigo-100 dark:border-indigo-950/40',
          headerBg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
        };
      case 'Capital':
        return {
          icon: HardHat,
          themeColor: 'text-slate-600 dark:text-slate-400',
          borderColor: 'border-slate-200 dark:border-slate-800',
          headerBg: 'bg-slate-50 dark:bg-slate-800/20',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        };
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
      ...( !isNaN(actualNum) ? { actual: actualNum } : {}),
      ...( !isNaN(targetNum) ? { target: targetNum } : {}),
      ...( !isNaN(warningNum) ? { warningThreshold: warningNum } : {})
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

  const isExceedingWarning = widget.actual !== undefined && 
                             widget.target !== undefined && 
                             widget.warningThreshold !== undefined && 
                             widget.target > 0 && 
                             widget.actual > widget.target * (widget.warningThreshold / 100);

  // Default fallback data structures for widgets if empty
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

  const heatmapData = widget.dataPoints || Array.from({ length: 24 }).map((_, idx) => ({
    label: `${idx}:00`,
    value: 0
  }));

  return (
    <div 
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", widget.id);
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId && draggedId !== widget.id && onReorder) {
          onReorder(draggedId, widget.id);
        }
      }}
      className={`relative bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col h-full cursor-grab active:cursor-grabbing ${
      isExceedingWarning 
        ? 'border-rose-500 ring-4 ring-rose-500/50 shadow-[0_0_20px_rgba(239,68,68,0.45)] animate-pulse' 
        : widget.state === 'red' 
          ? 'border-rose-400 dark:border-rose-900/60 ring-1 ring-rose-100 dark:ring-rose-950/20' 
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      {/* Widget Header */}
      <div className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${config.headerBg}`}>
        <div className="flex items-center gap-2 max-w-[65%]">
          <IconComponent className={`w-4 h-4 ${config.themeColor}`} />
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-[13px] truncate" title={widget.title}>
            {widget.title}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {widget.linkedWidgetId && (
            <div className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500 text-white dark:bg-emerald-600/80 tracking-widest" title="Auto-synchronizing values with connected huddleboard widget">
              🔗 Synced
            </div>
          )}
          {/* Status Badge */}
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${widget.state === 'red' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
            {widget.state === 'red' ? 'Deviation' : 'Target Met'}
          </div>

          {/* Performance Drift Alert */}
          {isExceedingWarning && (
            <div className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-bounce shadow" title={`Drift warning: Actual value has exceeded ${widget.warningThreshold}% of Target!`}>
              ⚠️ DRIFT
            </div>
          )}

          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Toggle Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => {
              setTempTitle(widget.title);
              setTempDesc(widget.description || '');
              setTempUnit(widget.unit || '');
              setTempActual(widget.actual?.toString() || '');
              setTempTarget(widget.target?.toString() || '');
              setTempWarningThreshold(widget.warningThreshold?.toString() || '');
              setIsEditing(!isEditing);
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Edit Target/Value & Sub-points"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => onDelete(widget.id)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
            title="Remove Widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description Info overlay */}
      {showInfo && widget.description && (
        <div className="bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 leading-relaxed">
          {widget.description}
        </div>
      )}

      {/* Edit Overlay Form - Fully interactive and customizable for all subpoints */}
      {isEditing && (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">KPI Title</label>
                <input 
                  type="text" 
                  required
                  value={tempTitle} 
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-bold" 
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Unit Symbol</label>
                <input 
                  type="text" 
                  value={tempUnit} 
                  onChange={(e) => setTempUnit(e.target.value)}
                  placeholder="e.g. % or min"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-semibold font-mono" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">KPI Description</label>
              <input 
                type="text" 
                value={tempDesc} 
                onChange={(e) => setTempDesc(e.target.value)}
                placeholder="Brief reason for tracking this..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-semibold" 
              />
            </div>
            
            <div className="flex items-end justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-1">
                {widget.actual !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Actual Value</label>
                    <input 
                      type="number" 
                      step="any"
                      value={tempActual} 
                      onChange={(e) => setTempActual(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-semibold font-mono" 
                    />
                  </div>
                )}
                {widget.target !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Target Limit</label>
                    <input 
                      type="number" 
                      step="any"
                      value={tempTarget} 
                      onChange={(e) => setTempTarget(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-semibold font-mono" 
                    />
                  </div>
                )}
                {widget.warningThreshold !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Warning Thresh (%)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={tempWarningThreshold} 
                      onChange={(e) => setTempWarningThreshold(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-semibold font-mono" 
                      placeholder="e.g. 110"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  type="submit" 
                  className="px-3.5 py-2 bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shadow-sm transition-colors uppercase tracking-wider font-mono"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {/* Checklist sub-points editing */}
          {widget.type === 'checklist' && widget.checklist && (
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Modify Checklist Steps</span>
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
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = widget.checklist!.filter(c => c.id !== item.id);
                        onUpdateValue(widget.id, { checklist: updated });
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
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
                  const updated = [...(widget.checklist || []), { id: `item-${Date.now()}`, label: 'New Checkpoint Task', checked: false }];
                  onUpdateValue(widget.id, { checklist: updated, state: 'red' });
                }}
                className="w-full py-1.5 text-xs font-bold text-slate-950 bg-[#FFC20E] hover:bg-[#E5B200] rounded-lg transition-colors cursor-pointer font-mono"
              >
                + Add Checkpoint
              </button>
            </div>
          )}

          {/* Pareto / Chart / Radar / Skills / Pareto-scrap / Heatmap sub-points editing */}
          {['chart', 'radar', 'pareto', 'skills', 'heatmap'].includes(widget.type) && (
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Modify Data Categories & Sub-items</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(widget.dataPoints || (
                  widget.type === 'skills' ? skillsData :
                  widget.type === 'radar' ? radarData :
                  widget.type === 'pareto' ? paretoData :
                  widget.type === 'heatmap' ? heatmapData : []
                )).map((dpItem, idx) => {
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
                      className="col-span-5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
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
                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-900 dark:text-white text-center"
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
                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white text-center font-mono"
                        placeholder="Target/Skill"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentList = (widget.dataPoints || skillsData).filter((_, i) => i !== idx);
                        const sum = currentList.reduce((acc, curr) => acc + curr.value, 0);
                        onUpdateValue(widget.id, { dataPoints: currentList, actual: sum });
                      }}
                      className="col-span-1 p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer flex items-center justify-center"
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
                  const currentList = [...(widget.dataPoints || skillsData), { label: 'New Category Item', value: 0, target: 100 }];
                  onUpdateValue(widget.id, { dataPoints: currentList });
                }}
                className="w-full py-1.5 text-xs font-bold text-slate-950 bg-[#FFC20E] hover:bg-[#E5B200] rounded-lg transition-colors cursor-pointer font-mono"
              >
                + Add Sub-item Category
              </button>
            </div>
          )}

          {/* Project milestones & Kanban sub-points editing */}
          {['project', 'kanban', 'countdown'].includes(widget.type) && (
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Modify Milestones & Cards</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(widget.milestones || (
                  widget.type === 'kanban' ? kanbanData :
                  widget.type === 'countdown' ? countdownData : []
                )).map((m, idx) => (
                  <div key={m.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <input 
                      type="text" 
                      value={m.name}
                      onChange={(e) => {
                        const currentList = [...(widget.milestones || kanbanData)];
                        currentList[idx] = { ...m, name: e.target.value };
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-5 px-2 py-1.5 text-[11px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Milestone task"
                    />
                    <select 
                      value={m.status}
                      onChange={(e) => {
                        const currentList = [...(widget.milestones || kanbanData)];
                        currentList[idx] = { ...m, status: e.target.value as any };
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-3 px-1 py-1.5 text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white font-mono"
                    >
                      <option value="pending">Pending/To Do</option>
                      <option value="active">Active/Testing</option>
                      <option value="completed">Completed/Done</option>
                    </select>
                    <input 
                      type="text" 
                      value={m.owner}
                      onChange={(e) => {
                        const currentList = [...(widget.milestones || kanbanData)];
                        currentList[idx] = { ...m, owner: e.target.value };
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-3 px-2 py-1.5 text-[11px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Owner"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentList = (widget.milestones || kanbanData).filter(ms => ms.id !== m.id);
                        onUpdateValue(widget.id, { milestones: currentList });
                      }}
                      className="col-span-1 p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer flex items-center justify-center"
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
                  const currentList = [...(widget.milestones || kanbanData), { id: `m-${Date.now()}`, name: 'New Item Card', status: 'pending' as const, owner: 'Staff', dueDate: new Date().toISOString().split('T')[0] }];
                  onUpdateValue(widget.id, { milestones: currentList, state: 'red' });
                }}
                className="w-full py-1.5 text-xs font-bold text-slate-950 bg-[#FFC20E] hover:bg-[#E5B200] rounded-lg transition-colors cursor-pointer font-mono"
              >
                + Add Milestone Card
              </button>
            </div>
          )}
        </div>
      )}

      {/* Widget Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        {/* COUNTER TYPE */}
        {widget.type === 'counter' && (
          <div className="text-center py-2 group/cnt">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onUpdateValue(widget.id, { value: Math.max(0, (widget.value || 0) - 1) })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-black cursor-pointer select-none transition-all"
                title="Decrement Day"
              >
                -1
              </button>
              <span className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                {widget.value || 0}
              </span>
              <button
                onClick={() => onUpdateValue(widget.id, { value: (widget.value || 0) + 1 })}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-black cursor-pointer select-none transition-all"
                title="Increment Day"
              >
                +1
              </button>
              <button
                onClick={() => onUpdateValue(widget.id, { value: 0 })}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded text-[10px] font-bold cursor-pointer transition-all font-mono"
                title="Reset Counter to 0"
              >
                Reset
              </button>
            </div>
            <span className="text-xs text-slate-400 block mt-1">consecutive days completed</span>
          </div>
        )}

        {/* NUMERIC TYPE */}
        {widget.type === 'numeric' && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="group/act">
                <span className="text-xs text-slate-400 block font-medium">Actual Today</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white tabular-nums">
                    {widget.actual ?? 0} <span className="text-sm font-normal text-slate-400">{widget.unit}</span>
                  </span>
                  
                  {/* Micro step adjustments */}
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 1) })}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded text-[10px] font-black cursor-pointer transition-all"
                      title="Decrement (-1)"
                    >
                      -
                    </button>
                    <button
                      onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 })}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded text-[10px] font-black cursor-pointer transition-all"
                      title="Increment (+1)"
                    >
                      +
                    </button>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Target Threshold</span>
                <span className="text-sm font-bold font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                  {widget.target ?? 0} {widget.unit}
                </span>
              </div>
            </div>

            {/* Micro visual progress bar */}
            {widget.target !== undefined && widget.actual !== undefined && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${widget.state === 'red' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, Math.max(5, (widget.actual / (widget.target || 1)) * 100))}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* CHECKLIST TYPE */}
        {widget.type === 'checklist' && widget.checklist && (
          <div className="space-y-2">
            {widget.checklist.map((item) => (
              <label 
                key={item.id} 
                className="flex items-start gap-2.5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <input 
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleChecklist(widget.id, item.id)}
                  className="mt-0.5 w-4 h-4 text-amber-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className={`text-[12px] leading-tight select-none transition-all ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300 font-semibold'}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* GAUGE PERCENTAGE TYPE */}
        {widget.type === 'gauge' && (
          <div className="flex flex-col items-center justify-center py-1 space-y-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="8"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke={widget.state === 'red' ? '#DC2626' : '#10B981'} 
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (widget.actual || 0) / 100)}`}
                  className="transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-bold font-mono text-slate-800 dark:text-white tabular-nums">
                  {widget.actual || 0}%
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Target {widget.target || 100}%</span>
              </div>
            </div>

            {/* Micro in-card controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 5) })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold cursor-pointer font-mono"
              >
                -5%
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={widget.actual || 0}
                onChange={(e) => onUpdateValue(widget.id, { actual: parseFloat(e.target.value) })}
                className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#FFC20E]"
              />
              <button
                onClick={() => onUpdateValue(widget.id, { actual: Math.min(100, (widget.actual || 0) + 5) })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold cursor-pointer font-mono"
              >
                +5%
              </button>
            </div>
          </div>
        )}

        {/* CHART / PARETO TYPE */}
        {widget.type === 'chart' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Defect Categories (Click -/+ to Adjust):
            </span>
            <div className="space-y-1.5">
              {(widget.dataPoints || [
                { label: 'Surface Scratches', value: 3, target: 1 },
                { label: 'Dimensional Deviations', value: 2, target: 1 }
              ]).map((dp, idx) => (
                <div 
                  key={dp.label} 
                  className="group flex flex-col p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      {dp.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleIncrementDefect(idx, -1)}
                        className="w-5 h-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded flex items-center justify-center font-black text-[10px] cursor-pointer hover:bg-rose-500 hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums px-1">
                        {dp.value}
                      </span>
                      <button
                        onClick={() => handleIncrementDefect(idx, 1)}
                        className="w-5 h-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded flex items-center justify-center font-black text-[10px] cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded overflow-hidden">
                    <div 
                      className={`h-full rounded transition-all duration-300 ${dp.value > (dp.target || 0) ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, Math.max(5, (dp.value / 10) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAPITAL PROJECT TIMELINE TYPE */}
        {widget.type === 'project' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Project Milestones (Click to Toggle Status):
            </span>
            <div className="space-y-1.5">
              {(widget.milestones || [
                { id: 'm-1', name: 'Draft Design and Engineering Plan', status: 'completed' as const, owner: 'Team Lead', dueDate: '2026-10-01' },
                { id: 'm-2', name: 'Tooling installation & dry run', status: 'active' as const, owner: 'Maintenance', dueDate: '2026-10-05' }
              ]).map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => toggleMilestone(m.id)}
                  className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-lg cursor-pointer hover:border-[#FFC20E] transition-all"
                  title={`Owner: ${m.owner} · Due: ${m.dueDate} · Click to cycle status`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      m.status === 'completed' ? 'bg-emerald-500' :
                      m.status === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                    }`}></div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {m.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STOPWATCH / CYCLE TIME TRACKER */}
        {widget.type === 'stopwatch' && (
          <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className={`text-3xl font-black font-mono tracking-tight tabular-nums block ${widget.actual && widget.actual > (widget.target || 45) ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
              {Math.floor((widget.actual || 0) / 60).toString().padStart(2, '0')}:
              {((widget.actual || 0) % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] text-slate-400 font-bold block uppercase font-mono">Target: {widget.target || 45}s Cycle Time</span>
            
            {/* Interactive Timer Controls */}
            <div className="flex justify-center items-center gap-2 pt-1">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 py-1 rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-all ${
                  isTimerRunning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  onUpdateValue(widget.id, { actual: 0 });
                }}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded text-xs font-bold cursor-pointer font-mono flex items-center gap-1"
                title="Reset timer to 0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* OEE HEAT MAP GRID */}
        {widget.type === 'heatmap' && (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Hourly Machine State (Click to cycle):</span>
              <button
                onClick={() => {
                  const resetList = heatmapData.map(h => ({ ...h, value: 0 }));
                  onUpdateValue(widget.id, { dataPoints: resetList });
                }}
                className="text-[9px] font-mono text-slate-400 hover:text-rose-500 underline cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {heatmapData.map((hp, i) => {
                const val = hp.value || 0;
                // 0 = Green (Running), 1 = Amber (Idle), 2 = Red (Downtime), 3 = Gray (Off)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const updated = [...heatmapData];
                      updated[i] = { ...hp, value: (val + 1) % 4 };
                      onUpdateValue(widget.id, { dataPoints: updated });
                    }}
                    className={`h-5 rounded border text-[8px] font-mono font-extrabold flex items-center justify-center cursor-pointer select-none transition-all ${
                      val === 0 ? 'bg-emerald-500 border-emerald-600 text-white' :
                      val === 1 ? 'bg-amber-500 border-amber-600 text-slate-950' :
                      val === 2 ? 'bg-rose-500 border-rose-600 text-white animate-pulse' :
                      'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}
                    title={`Hour ${i}:00 - Click to cycle state`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 font-bold font-mono">
              <span>🟢 Running</span>
              <span>🟡 Idle</span>
              <span>🔴 Downtime</span>
              <span>⚪ Off</span>
            </div>
          </div>
        )}

        {/* SCRAP & WASTE PARETO BAR CHART */}
        {widget.type === 'pareto' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Scrap Distribution (Click -/+ to edit):</span>
            {paretoData.map((item, idx) => (
              <div key={item.label} className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span>{item.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const updated = [...paretoData];
                        updated[idx] = { ...item, value: Math.max(0, item.value - 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-4 h-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-black text-[9px] flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-rose-500 font-bold px-1">{item.value}%</span>
                    <button
                      onClick={() => {
                        const updated = [...paretoData];
                        updated[idx] = { ...item, value: Math.min(100, item.value + 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-4 h-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-black text-[9px] flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, item.value)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SKILL MATRIX / CROSS-TRAINING GRID */}
        {widget.type === 'skills' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Team Skill Levels (Click stars to edit):</span>
            {skillsData.map((p, pIdx) => (
              <div key={p.label} className="flex items-center justify-between text-[11px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">{p.label}</span>
                  <span className="text-[9px] text-slate-400 block font-mono">{p.target || 'General Competency'}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((starVal) => (
                    <button
                      key={starVal}
                      onClick={() => {
                        const updated = [...skillsData];
                        updated[pIdx] = { ...p, value: starVal };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className={`w-4 h-4 rounded text-[9px] font-extrabold cursor-pointer transition-all ${
                        starVal <= p.value 
                          ? 'bg-[#FFC20E] text-slate-950 font-black' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
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

        {/* IDEA INCUBATOR KANBAN BOARD */}
        {widget.type === 'kanban' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Suggestions Cards (Click card to advance status):</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'To Do', key: 'pending' },
                { label: 'In Testing', key: 'active' },
                { label: 'SOP Done', key: 'completed' }
              ].map((col) => {
                const cards = kanbanData.filter(c => c.status === col.key);
                return (
                  <div key={col.key} className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800 rounded-lg space-y-1.5 min-h-[80px]">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block font-mono border-b border-slate-200 dark:border-slate-700 pb-1">
                      {col.label} ({cards.length})
                    </span>
                    {cards.map(card => (
                      <div 
                        key={card.id}
                        onClick={() => toggleMilestone(card.id)}
                        className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer hover:border-[#FFC20E] transition-all leading-tight"
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

        {/* SHIFT HANDOVER SIGN-OFF BLOCK */}
        {widget.type === 'handover' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Shift Transition Status</span>
              <span className="text-xs text-slate-800 dark:text-slate-200 block font-bold font-mono">Shift A &rarr; Shift B</span>
            </div>
            
            <button
              onClick={() => onUpdateValue(widget.id, { state: widget.state === 'green' ? 'red' : 'green' })}
              className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-sm font-mono ${
                widget.state === 'green' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 font-black'
              }`}
            >
              {widget.state === 'green' ? '✓ SHIFT HANDOVER SIGNED' : '⚠️ AWAITING SIGNOFF'}
            </button>

            {/* Editable Transition Notes */}
            <textarea
              rows={2}
              value={widget.description || ''}
              onChange={(e) => onUpdateValue(widget.id, { description: e.target.value })}
              placeholder="Type supervisor handover notes or shift logs here..."
              className="w-full text-xs p-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#FFC20E]"
            />
          </div>
        )}

        {/* HAZARD ALERT LEVEL GAUGE */}
        {widget.type === 'riskGauge' && (
          <div className="space-y-2 py-1 text-center">
            <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '30%' }}></div>
              <div className="bg-amber-500 h-full" style={{ width: '40%' }}></div>
              <div className="bg-rose-500 h-full" style={{ width: '30%' }}></div>
              <div 
                className="absolute top-0 bottom-0 w-1 bg-slate-950 dark:bg-white transition-all duration-500 shadow"
                style={{ left: `${Math.min(100, Math.max(0, widget.actual || 25))}%` }}
              ></div>
            </div>
            
            {/* Interactive controls */}
            <div className="flex justify-between items-center text-[10px] font-mono pt-1">
              <button
                onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 5) })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold cursor-pointer"
              >
                -5 Risk
              </button>
              <span className="font-extrabold text-slate-900 dark:text-white">LOTO Index: {widget.actual || 0} / 100</span>
              <button
                onClick={() => onUpdateValue(widget.id, { actual: Math.min(100, (widget.actual || 0) + 5) })}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold cursor-pointer"
              >
                +5 Risk
              </button>
            </div>
          </div>
        )}

        {/* CO₂ EMISSION SPARKLINE */}
        {widget.type === 'emission' && (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Carbon Footprint:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <button
                  onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 5) })}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-black cursor-pointer"
                >
                  -5
                </button>
                <span className="font-bold text-emerald-600 text-sm">{widget.actual || 0} {widget.unit || 'kg'}</span>
                <button
                  onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 5 })}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-black cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-10 rounded-lg overflow-hidden flex items-end relative p-1">
              <div className="absolute top-0.5 right-1.5 text-[8px] font-mono text-slate-400">Target: {widget.target || 150} kg</div>
              <div className="w-full flex items-end justify-between h-6 gap-0.5">
                {[30, 45, 60, 55, 75, 90, 85, 110, widget.actual || 120].map((hVal, hIdx) => (
                  <div
                    key={hIdx}
                    className={`w-full rounded-t-sm transition-all duration-500 ${hVal > (widget.target || 150) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                    style={{ height: `${Math.min(100, (hVal / (widget.target || 150)) * 100)}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5S WORKPLACE AUDIT RADAR */}
        {widget.type === 'radar' && (
          <div className="space-y-1.5 py-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">5S Audit Scorecard (Adjust scores):</span>
            {radarData.map((category, idx) => (
              <div key={category.label} className="space-y-0.5 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[10px] font-bold text-slate-800 dark:text-slate-200">
                  <span>{category.label}</span>
                  <div className="flex items-center gap-1 font-mono">
                    <button
                      onClick={() => {
                        const updated = [...radarData];
                        updated[idx] = { ...category, value: Math.max(0, category.value - 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-4 h-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-black text-[9px] flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-indigo-600 dark:text-indigo-400 px-1 font-bold">{category.value}/100</span>
                    <button
                      onClick={() => {
                        const updated = [...radarData];
                        updated[idx] = { ...category, value: Math.min(100, category.value + 5) };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="w-4 h-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-black text-[9px] flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, category.value)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEAD TIME COUNTDOWN TRACKER */}
        {widget.type === 'countdown' && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Pipeline Stages (Click to toggle status):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {countdownData.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => toggleMilestone(stage.id)}
                  className={`p-1.5 rounded-lg border text-[9px] font-bold font-mono uppercase cursor-pointer text-center transition-all ${
                    stage.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                    stage.status === 'active' ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 animate-pulse' :
                    'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAKT-TIME PACE PULSE */}
        {widget.type === 'pulse' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold block uppercase font-mono">Takt Pace Index</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  Actual: {widget.actual || 80} vs Target: {widget.target || 80}
                </span>
                <div className="flex items-center gap-1 font-mono">
                  <button
                    onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 1) })}
                    className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-extrabold cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 })}
                    className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-extrabold cursor-pointer"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>
            
            {/* Pulsing indicator */}
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </div>
          </div>
        )}
      </div>

      {/* Widget Footer Status Alert */}
      {widget.state === 'red' && (
        <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-2 border-t border-rose-100 dark:border-rose-950/40 flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Active deviation logged for Weekly Huddleboard analysis.</span>
        </div>
      )}
    </div>
  );
}
