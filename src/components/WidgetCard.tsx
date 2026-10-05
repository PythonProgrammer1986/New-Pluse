import React, { useState } from 'react';
import { MetricWidget, Pillar } from '../types';
import { 
  Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat, 
  Trash2, Edit, Check, Play, Info, AlertTriangle, Eye, EyeOff
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
          headerBg: 'bg-slate-50 dark:bg-slate-850/20',
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

  const handleIncrementDefect = (index: number) => {
    if (widget.dataPoints) {
      const updatedDataPoints = [...widget.dataPoints];
      updatedDataPoints[index] = {
        ...updatedDataPoints[index],
        value: updatedDataPoints[index].value + 1
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
      
      // Determine if project is red or green based on any pending milestone overdue or active
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
        <div className="bg-slate-50 dark:bg-slate-850 p-3 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-850 leading-relaxed">
          {widget.description}
        </div>
      )}

      {/* Edit Overlay Form - Fully interactive and customizable for all subpoints */}
      {isEditing && (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">KPI Title</label>
                <input 
                  type="text" 
                  required
                  value={tempTitle} 
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold" 
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Unit Symbol</label>
                <input 
                  type="text" 
                  value={tempUnit} 
                  onChange={(e) => setTempUnit(e.target.value)}
                  placeholder="e.g. % or min"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold font-mono" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">KPI Description</label>
              <input 
                type="text" 
                value={tempDesc} 
                onChange={(e) => setTempDesc(e.target.value)}
                placeholder="Brief reason for tracking this..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold" 
              />
            </div>
            
            <div className="flex items-end justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-1">
                {widget.actual !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Actual Value</label>
                    <input 
                      type="number" 
                      step="any"
                      value={tempActual} 
                      onChange={(e) => setTempActual(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold font-mono" 
                    />
                  </div>
                )}
                {widget.target !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Target Limit</label>
                    <input 
                      type="number" 
                      step="any"
                      value={tempTarget} 
                      onChange={(e) => setTempTarget(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold font-mono" 
                    />
                  </div>
                )}
                {widget.warningThreshold !== undefined && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Warning Thresh (%)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={tempWarningThreshold} 
                      onChange={(e) => setTempWarningThreshold(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold font-mono" 
                      placeholder="e.g. 110"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  type="submit" 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-colors uppercase tracking-wider"
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
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Modify Checklist Steps</span>
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
                className="w-full py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:text-indigo-400 transition-colors cursor-pointer"
              >
                + Add Checkpoint
              </button>
            </div>
          )}

          {/* Defect Pareto categories sub-points editing */}
          {widget.type === 'chart' && widget.dataPoints && (
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Modify Pareto Defect Subpoints</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {widget.dataPoints.map((dp, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <input 
                      type="text" 
                      value={dp.label}
                      onChange={(e) => {
                        const updated = [...widget.dataPoints!];
                        updated[idx] = { ...dp, label: e.target.value };
                        onUpdateValue(widget.id, { dataPoints: updated });
                      }}
                      className="col-span-6 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Category name"
                    />
                    <div className="col-span-3">
                      <input 
                        type="number" 
                        value={dp.value}
                        onChange={(e) => {
                          const updated = [...widget.dataPoints!];
                          updated[idx] = { ...dp, value: parseFloat(e.target.value) || 0 };
                          const sum = updated.reduce((acc, curr) => acc + curr.value, 0);
                          onUpdateValue(widget.id, { dataPoints: updated, actual: sum });
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-900 dark:text-white text-center"
                        placeholder="Act"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        value={dp.target || 0}
                        onChange={(e) => {
                          const updated = [...widget.dataPoints!];
                          updated[idx] = { ...dp, target: parseFloat(e.target.value) || 0 };
                          onUpdateValue(widget.id, { dataPoints: updated });
                        }}
                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-900 dark:text-white text-center"
                        placeholder="Tgt"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = widget.dataPoints!.filter((_, i) => i !== idx);
                        const sum = updated.reduce((acc, curr) => acc + curr.value, 0);
                        onUpdateValue(widget.id, { dataPoints: updated, actual: sum });
                      }}
                      className="col-span-1 p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer flex items-center justify-center"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [...(widget.dataPoints || []), { label: 'New Defect Category', value: 0, target: 1 }];
                  onUpdateValue(widget.id, { dataPoints: updated });
                }}
                className="w-full py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:text-indigo-400 transition-colors cursor-pointer"
              >
                + Add Defect Category
              </button>
            </div>
          )}

          {/* Project milestones sub-points editing */}
          {widget.type === 'project' && widget.milestones && (
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Modify Milestone Subpoints</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {widget.milestones.map((m, idx) => (
                  <div key={m.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <input 
                      type="text" 
                      value={m.name}
                      onChange={(e) => {
                        const updated = [...widget.milestones!];
                        updated[idx] = { ...m, name: e.target.value };
                        onUpdateValue(widget.id, { milestones: updated });
                      }}
                      className="col-span-5 px-2 py-1.5 text-[11px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Milestone task"
                    />
                    <input 
                      type="text" 
                      value={m.owner}
                      onChange={(e) => {
                        const updated = [...widget.milestones!];
                        updated[idx] = { ...m, owner: e.target.value };
                        onUpdateValue(widget.id, { milestones: updated });
                      }}
                      className="col-span-3 px-2 py-1.5 text-[11px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Owner"
                    />
                    <input 
                      type="date" 
                      value={m.dueDate}
                      onChange={(e) => {
                        const updated = [...widget.milestones!];
                        updated[idx] = { ...m, dueDate: e.target.value };
                        onUpdateValue(widget.id, { milestones: updated });
                      }}
                      className="col-span-3 px-1.5 py-1.5 text-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = widget.milestones!.filter(ms => ms.id !== m.id);
                        onUpdateValue(widget.id, { milestones: updated });
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
                  const updated = [...(widget.milestones || []), { id: `m-${Date.now()}`, name: 'New Project Step', status: 'pending' as const, owner: 'Staff', dueDate: new Date().toISOString().split('T')[0] }];
                  onUpdateValue(widget.id, { milestones: updated, state: 'red' });
                }}
                className="w-full py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:text-indigo-400 transition-colors cursor-pointer"
              >
                + Add Milestone Task
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
                className="p-1 w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-md text-[10px] font-black cursor-pointer select-none opacity-0 group-hover/cnt:opacity-100 transition-opacity"
                title="Decrement Day"
              >
                -
              </button>
              <span className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                {widget.value}
              </span>
              <button
                onClick={() => onUpdateValue(widget.id, { value: (widget.value || 0) + 1 })}
                className="p-1 w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-md text-[10px] font-black cursor-pointer select-none opacity-0 group-hover/cnt:opacity-100 transition-opacity"
                title="Increment Day"
              >
                +
              </button>
            </div>
            <span className="text-xs text-slate-400 block mt-1">days completed</span>
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
                    {widget.actual} <span className="text-sm font-normal text-slate-400">{widget.unit}</span>
                  </span>
                  
                  {/* Micro step adjustments on hover */}
                  <span className="inline-flex items-center gap-1 opacity-0 group-hover/act:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 1) })}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 rounded text-[10px] font-black cursor-pointer transition-all"
                      title="Decrement (-1)"
                    >
                      -
                    </button>
                    <button
                      onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 })}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-500 hover:text-emerald-600 rounded text-[10px] font-black cursor-pointer transition-all"
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
                  {widget.target} {widget.unit}
                </span>
              </div>
            </div>

            {/* Micro visual progress bar */}
            {widget.target && widget.actual !== undefined && (
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
                className="flex items-start gap-2.5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-colors"
              >
                <input 
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleChecklist(widget.id, item.id)}
                  className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className={`text-[12px] leading-tight select-none transition-all ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* GAUGE PERCENTAGE TYPE */}
        {widget.type === 'gauge' && widget.actual !== undefined && widget.target !== undefined && (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Simple beautiful SVG semi-circular or circular progress gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background track */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="8"
                />
                {/* Active progress */}
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
                  {widget.actual}%
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Target {widget.target}%</span>
              </div>
            </div>
          </div>
        )}

        {/* CHART / PARETO TYPE */}
        {widget.type === 'chart' && widget.dataPoints && (
          <div className="space-y-2 py-1">
            {widget.description && (
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Logged Defect Types (Click to Add):
              </span>
            )}
            <div className="space-y-1.5">
              {widget.dataPoints.map((dp, idx) => (
                <div 
                  key={dp.label} 
                  onClick={() => handleIncrementDefect(idx)}
                  className="group flex flex-col cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 p-1 rounded transition-colors"
                  title={`Click to log +1 ${dp.label}`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 transition-colors">
                      {dp.label}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white tabular-nums">
                      {dp.value} <span className="text-slate-400 text-[9px] font-normal">(+{dp.value - (dp.target || 0)})</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded overflow-hidden">
                    <div 
                      className={`h-full rounded transition-all duration-300 ${dp.value > (dp.target || 0) ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, Math.max(5, (dp.value / 10) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Target cumulative: &le; {widget.target}</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">Total: {widget.actual}</span>
            </div>
          </div>
        )}

        {/* CAPITAL PROJECT TIMELINE TYPE */}
        {widget.type === 'project' && widget.milestones && (
          <div className="space-y-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Project Milestones:
            </span>
            <div className="space-y-1.5">
              {widget.milestones.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => toggleMilestone(m.id)}
                  className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-lg cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  title={`Owner: ${m.owner} · Due: ${m.dueDate} · Click to toggle status`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      m.status === 'completed' ? 'bg-emerald-500' :
                      m.status === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                    }`}></div>
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                      {m.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-medium text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. STOPWATCH / CYCLE TIME TRACKER */}
        {widget.type === 'stopwatch' && (
          <div className="text-center py-1 bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/50">
            <span className={`text-3xl font-black font-mono tracking-tight tabular-nums block ${widget.actual && widget.actual > (widget.target || 45) ? 'text-rose-500 animate-pulse' : 'text-slate-850 dark:text-white'}`}>
              00:{widget.actual && widget.actual < 10 ? `0${widget.actual}` : widget.actual}
            </span>
            <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase">Target: {widget.target || 45}s Standard Work</span>
            <div className="flex justify-center gap-1.5 mt-2">
              <button
                onClick={() => onUpdateValue(widget.id, { actual: Math.max(0, (widget.actual || 0) - 1) })}
                className="px-2.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold cursor-pointer transition-colors"
              >
                -1s
              </button>
              <button
                onClick={() => onUpdateValue(widget.id, { actual: (widget.actual || 0) + 1 })}
                className="px-2.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold cursor-pointer transition-colors"
              >
                +1s
              </button>
            </div>
          </div>
        )}

        {/* 2. OEE HEAT MAP GRID */}
        {widget.type === 'heatmap' && (
          <div className="space-y-1.5 py-1">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Hourly Machine Running State:</span>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const states: ('green' | 'amber' | 'red')[] = ['green', 'green', 'green', 'amber', 'green', 'red', 'green', 'green'];
                const stateVal = states[(i + (widget.actual || 0)) % states.length];
                return (
                  <button
                    key={i}
                    onClick={() => onUpdateValue(widget.id, { actual: ((widget.actual || 0) + 1) % 24 })}
                    className={`h-4 rounded border text-[8px] font-mono font-bold flex items-center justify-center cursor-pointer select-none transition-all ${
                      stateVal === 'green' ? 'bg-emerald-500 border-emerald-600 text-white' :
                      stateVal === 'amber' ? 'bg-amber-500 border-amber-600 text-slate-900' :
                      'bg-rose-500 border-rose-600 text-white animate-pulse'
                    }`}
                    title={`Hour ${i}:00 - Click to cycle state`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 font-bold pt-1">
              <span>🟢 Running</span>
              <span>🟡 Idle</span>
              <span>🔴 Downtime</span>
            </div>
          </div>
        )}

        {/* 3. SCRAP & WASTE PARETO BAR CHART */}
        {widget.type === 'pareto' && (
          <div className="space-y-2 py-1">
            {[
              { reason: 'Startup Loss', val: 40 },
              { reason: 'Tool Defect', val: 25 },
              { reason: 'Overfill Waste', val: 15 },
              { reason: 'Operator Error', val: 5 }
            ].map((item) => (
              <div key={item.reason} className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  <span>{item.reason}</span>
                  <span className="font-mono text-rose-500">{item.val}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. SKILL MATRIX / CROSS-TRAINING GRID */}
        {widget.type === 'skills' && (
          <div className="space-y-1.5 py-1">
            {[
              { name: 'Marcus L.', skill: 'SmartROC Drill', score: 4 },
              { name: 'Helena S.', skill: 'Minetruck MT42', score: 3 },
              { name: 'Jonas K.', skill: 'EHS Isolation', score: 2 }
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between text-[10px] p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <div>
                  <span className="font-bold text-slate-800 dark:text-white block">{p.name}</span>
                  <span className="text-[8px] text-slate-400 block">{p.skill}</span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 4 }).map((_, starIdx) => (
                    <div
                      key={starIdx}
                      className={`w-3.5 h-3 rounded-sm ${starIdx < p.score ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      title={`${p.score}/4 Skills Complete`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. IDEA INCUBATOR KANBAN BOARD */}
        {widget.type === 'kanban' && (
          <div className="grid grid-cols-3 gap-1 py-1">
            {[
              { col: 'To Do', tpl: 'Tool Cart 5S' },
              { col: 'Testing', tpl: 'LED Takt Lamp' },
              { col: 'SOP Standard', tpl: 'LOTO Box' }
            ].map((item) => (
              <div key={item.col} className="p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-lg text-center space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">{item.col}</span>
                <div className="p-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded text-[9px] font-bold text-slate-700 dark:text-slate-200 shadow-sm leading-tight">
                  {item.tpl}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. SHIFT HANDOVER SIGN-OFF BLOCK */}
        {widget.type === 'handover' && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Shift Handover Status</span>
              <span className="text-[10px] text-slate-700 dark:text-slate-300 block font-bold">Shift A &rarr; Shift B</span>
            </div>
            <button
              onClick={() => onUpdateValue(widget.id, { state: widget.state === 'green' ? 'red' : 'green' })}
              className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide cursor-pointer transition-all shadow-sm ${
                widget.state === 'green' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {widget.state === 'green' ? '✓ SIGNED & HANDED OVER' : 'AWAITING SIGNOFF'}
            </button>
            <span className="text-[8px] font-mono text-slate-400 block mt-1">SOP Handover Log Completed</span>
          </div>
        )}

        {/* 7. HAZARD ALERT LEVEL GAUGE */}
        {widget.type === 'riskGauge' && (
          <div className="space-y-2 py-1 text-center">
            <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '30%' }}></div>
              <div className="bg-amber-500 h-full" style={{ width: '40%' }}></div>
              <div className="bg-rose-500 h-full" style={{ width: '30%' }}></div>
              <div 
                className="absolute top-0 bottom-0 w-1 bg-slate-950 dark:bg-white transition-all duration-500 shadow"
                style={{ left: `${widget.actual || 35}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[8px] text-slate-400 font-black uppercase tracking-wider font-mono">
              <span className="text-emerald-500">Safe</span>
              <span className="text-amber-500">Elevated</span>
              <span className="text-rose-500">Critical</span>
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono">LOTO Risk Index: {widget.actual || 35} / 100</span>
          </div>
        )}

        {/* 8. CO₂ EMISSION SPARKLINE */}
        {widget.type === 'emission' && (
          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Carbon equivalent index:</span>
              <span className="font-mono font-bold text-emerald-600">{widget.actual} kg</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-10 rounded-lg overflow-hidden flex items-end relative p-1">
              <div className="absolute top-0.5 right-1.5 text-[8px] font-mono text-slate-400">Target: {widget.target} kg</div>
              <div className="w-full flex items-end justify-between h-6 gap-0.5">
                {[30, 45, 60, 55, 75, 90, 85, 110, widget.actual || 120].map((hVal, hIdx) => (
                  <div
                    key={hIdx}
                    className={`w-full rounded-t-sm transition-all duration-500 ${hVal > (widget.target || 150) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                    style={{ height: `${(hVal / 150) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. 5S WORKPLACE AUDIT RADAR */}
        {widget.type === 'radar' && (
          <div className="space-y-1.5 py-1">
            {[
              { cat: 'Sort (Seiri)', val: 95 },
              { cat: 'Set in Order (Seiton)', val: 80 },
              { cat: 'Shine (Seiso)', val: 90 },
              { cat: 'Standardize (Seiketsu)', val: 85 },
              { cat: 'Sustain (Shitsuke)', val: 75 }
            ].map((category) => (
              <div key={category.cat} className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-650 dark:text-slate-350">
                  <span>{category.cat}</span>
                  <span className="font-mono">{category.val}/100</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${category.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 10. LEAD TIME COUNTDOWN TRACKER */}
        {widget.type === 'countdown' && (
          <div className="space-y-2 py-1">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Rig Shipping Pipeline:</span>
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg border border-slate-200/50">
              <span className="text-emerald-500">1. Load ✓</span>
              <span className="text-emerald-500">2. Assy ✓</span>
              <span className="text-amber-500 animate-pulse">3. QA Test</span>
              <span className="text-slate-300">4. Dispatch</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}

        {/* 11. TAKT-TIME PACE PULSE */}
        {widget.type === 'pulse' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Takt Pace Index</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block font-mono">Actual: {widget.actual || 85} vs Target: {widget.target || 80}</span>
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
        <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-2 border-t border-rose-100 dark:border-rose-950/40 flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Active deviation connected to Weekly Stand-up board.</span>
        </div>
      )}
    </div>
  );
}
