import React, { useState, useMemo, useRef } from 'react';
import { ProjectTrackRecord, MatrixPoint, Employee } from '../types';
import { 
  Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  User, CheckCircle2, AlertCircle, Clock, Filter, SlidersHorizontal 
} from 'lucide-react';

interface GanttTimelineViewProps {
  project: ProjectTrackRecord;
  employees: Employee[];
  onUpdatePoint: (projectId: string, pointId: string, updates: Partial<MatrixPoint>) => void;
  onSelectPoint: (point: MatrixPoint) => void;
  allCategories: string[];
}

export default function GanttTimelineView({
  project,
  employees,
  onUpdatePoint,
  onSelectPoint,
  allCategories
}: GanttTimelineViewProps) {
  // Zoom mode: days across 30, 60, or 90 days
  const [zoomDays, setZoomDays] = useState<number>(60);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dragging state for drag-to-adjust timeline bars
  const [dragState, setDragState] = useState<{
    pointId: string;
    type: 'move' | 'resize';
    startX: number;
    initialStartDayOffset: number;
    initialDurationDays: number;
  } | null>(null);

  // Timeline base anchor date (start of timeline: e.g. Oct 1, 2026 or today - 7 days)
  const baseDate = useMemo(() => {
    const today = new Date('2026-10-17'); // current anchor
    today.setDate(today.getDate() - 10);
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  // Generate days array for timeline header
  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < zoomDays; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [baseDate, zoomDays]);

  // Day width in pixels
  const dayWidth = zoomDays <= 30 ? 44 : zoomDays <= 60 ? 28 : 18;

  // Helpers to convert Date <-> Timeline X position
  const dateToOffset = (dateStr?: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const diffTime = d.getTime() - baseDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const offsetToDateStr = (offset: number) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  // Filter project points
  const filteredPoints = useMemo(() => {
    if (!project.points) return [];
    return project.points.filter((pt) => {
      const matchCat = selectedCategory === 'all' || pt.category === selectedCategory;
      const matchSearch = 
        !searchQuery || 
        pt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [project.points, selectedCategory, searchQuery]);

  // Calculate Today's pixel offset
  const todayOffset = dateToOffset('2026-10-17');
  const todayLeftPx = todayOffset * dayWidth;

  // Handle Drag Move / Resize
  const handleMouseDown = (
    e: React.MouseEvent,
    point: MatrixPoint,
    type: 'move' | 'resize'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Default dates if missing
    const targetOffset = dateToOffset(point.targetDate || '2026-11-15');
    const startOffset = point.startDate 
      ? dateToOffset(point.startDate) 
      : Math.max(0, targetOffset - 14);
    const duration = Math.max(1, targetOffset - startOffset);

    setDragState({
      pointId: point.id,
      type,
      startX: e.clientX,
      initialStartDayOffset: startOffset,
      initialDurationDays: duration
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const dayDelta = Math.round(deltaX / dayWidth);

    if (dragState.type === 'move') {
      const newStartOffset = Math.max(0, dragState.initialStartDayOffset + dayDelta);
      const newTargetOffset = newStartOffset + dragState.initialDurationDays;

      const newStartDate = offsetToDateStr(newStartOffset);
      const newTargetDate = offsetToDateStr(newTargetOffset);

      onUpdatePoint(project.id, dragState.pointId, {
        startDate: newStartDate,
        targetDate: newTargetDate
      });
    } else if (dragState.type === 'resize') {
      const newDuration = Math.max(1, dragState.initialDurationDays + dayDelta);
      const newTargetOffset = dragState.initialStartDayOffset + newDuration;
      const newTargetDate = offsetToDateStr(newTargetOffset);

      onUpdatePoint(project.id, dragState.pointId, {
        targetDate: newTargetDate
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Helper for Status color
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-slate-950';
      case 'on-track': return 'bg-blue-500 text-white';
      case 'in-progress': return 'bg-amber-500 text-slate-950';
      case 'at-risk':
      case 'delayed': return 'bg-rose-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div 
      className="space-y-4 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Timeline Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFC20E]" />
            <span className="text-xs font-black uppercase tracking-wider font-mono">
              Gantt Schedule
            </span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none"
          >
            <option value="all">All Dimensions ({allCategories.length})</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline items..."
            className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl placeholder-slate-400 focus:outline-none focus:border-[#FFC20E] w-48"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Zoom View:</span>
          {[
            { days: 30, label: '30 Days' },
            { days: 60, label: '60 Days' },
            { days: 90, label: '90 Days' }
          ].map((z) => (
            <button
              key={z.days}
              type="button"
              onClick={() => setZoomDays(z.days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                zoomDays === z.days
                  ? 'bg-[#FFC20E] text-slate-950 font-black shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* GANTT CONTAINER with Horizontal Scroll */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        
        <div className="overflow-x-auto">
          <div style={{ minWidth: 260 + timelineDays.length * dayWidth }}>
            
            {/* TIMELINE CALENDAR HEADER */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-20">
              
              {/* Left Column Label */}
              <div className="w-64 p-3 font-mono text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900 sticky left-0 z-30">
                Track Point / Dimension
              </div>

              {/* Days Header */}
              <div className="flex relative">
                {timelineDays.map((date, idx) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isFirstOfMonth = date.getDate() === 1;
                  const isToday = date.toISOString().split('T')[0] === '2026-10-17';

                  return (
                    <div
                      key={idx}
                      style={{ width: dayWidth }}
                      className={`text-center py-2 text-[10px] font-mono border-r border-slate-200 dark:border-slate-850 shrink-0 ${
                        isToday 
                          ? 'bg-[#FFC20E]/20 text-[#FFC20E] font-black' 
                          : isWeekend 
                          ? 'bg-slate-100/50 dark:bg-slate-900/60 text-slate-400' 
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-[8px] text-slate-400 uppercase">
                        {date.toLocaleDateString([], { weekday: 'narrow' })}
                      </span>
                      <span className={`block font-bold ${isFirstOfMonth ? 'underline font-black text-amber-500' : ''}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* TIMELINE ROWS */}
            <div className="divide-y divide-slate-100 dark:divide-slate-850 relative">
              
              {/* Today Red Indicator Vertical Line */}
              {todayOffset >= 0 && todayOffset < zoomDays && (
                <div
                  style={{ left: 256 + todayLeftPx + (dayWidth / 2) }}
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                  title="Current Date"
                >
                  <div className="sticky top-12 -ml-6 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-mono font-bold rounded shadow uppercase">
                    Today
                  </div>
                </div>
              )}

              {filteredPoints.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No points matching the active filter.
                </div>
              ) : (
                filteredPoints.map((point) => {
                  const targetOffset = dateToOffset(point.targetDate || '2026-11-15');
                  const startOffset = point.startDate
                    ? dateToOffset(point.startDate)
                    : Math.max(0, targetOffset - 14);
                  const duration = Math.max(1, targetOffset - startOffset);

                  const barLeft = startOffset * dayWidth;
                  const barWidth = Math.max(dayWidth, duration * dayWidth);

                  const assignedEmp = employees.find((e) => e.id === point.assignedToEmployeeId);

                  return (
                    <div
                      key={point.id}
                      className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Left Point Info Card */}
                      <div 
                        onClick={() => onSelectPoint(point)}
                        className="w-64 p-3 border-r border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950 sticky left-0 z-20 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                            {point.category}
                          </span>
                          <span className={`text-[8px] font-bold px-1 rounded uppercase ${getStatusBg(point.status)}`}>
                            {point.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-1 group-hover:text-amber-500 transition-colors" title={point.title}>
                          {point.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                          <span>{point.progressPercent}% complete</span>
                          <span>{assignedEmp ? assignedEmp.name : 'Unassigned'}</span>
                        </div>
                      </div>

                      {/* Timeline Bar Area */}
                      <div className="flex-1 relative py-3 h-16 flex items-center">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {timelineDays.map((_, i) => (
                            <div
                              key={i}
                              style={{ width: dayWidth }}
                              className="border-r border-slate-100 dark:border-slate-850/60 h-full shrink-0"
                            />
                          ))}
                        </div>

                        {/* Interactive Gantt Bar */}
                        <div
                          style={{
                            left: barLeft,
                            width: barWidth
                          }}
                          onMouseDown={(e) => handleMouseDown(e, point, 'move')}
                          className={`absolute h-8 rounded-lg shadow-sm border border-slate-800/20 cursor-grab active:cursor-grabbing flex items-center overflow-hidden transition-all group/bar hover:ring-2 hover:ring-[#FFC20E] z-10 ${getStatusBg(point.status)}`}
                          title={`${point.title} (${point.startDate || 'Start'} -> ${point.targetDate}) - Drag to reschedule`}
                        >
                          {/* Progress fill bar */}
                          <div
                            style={{ width: `${point.progressPercent}%` }}
                            className="absolute left-0 top-0 bottom-0 bg-black/25 pointer-events-none"
                          />

                          {/* Bar text content */}
                          <div className="relative px-2 flex items-center justify-between gap-1 w-full text-[11px] font-bold truncate">
                            <span className="truncate">{point.title}</span>
                            <span className="font-mono text-[9px] opacity-90 shrink-0">
                              {point.targetDate ? point.targetDate.slice(5) : ''}
                            </span>
                          </div>

                          {/* Right Resize Handle (Drag to adjust target date duration) */}
                          <div
                            onMouseDown={(e) => handleMouseDown(e, point, 'resize')}
                            className="absolute right-0 top-0 bottom-0 w-2.5 bg-black/30 hover:bg-[#FFC20E] cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity"
                            title="Drag right handle to extend/shorten duration"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>
        </div>

      </div>

      <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2 px-2">
        <span>💡 <strong>Interactive Hint:</strong> Click & drag any colored bar horizontally to shift dates. Drag the right edge of any bar to extend or shorten its duration.</span>
        <span>Today: 2026-10-17</span>
      </div>
    </div>
  );
}
