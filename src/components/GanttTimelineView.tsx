import React, { useState, useMemo } from 'react';
import { ProjectTrackRecord, MatrixPoint, Employee } from '../types';
import { Calendar, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

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
  const [zoomDays, setZoomDays] = useState<number>(60);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [panOffsetDays, setPanOffsetDays] = useState<number>(0);

  const [dragState, setDragState] = useState<{
    pointId: string;
    type: 'move' | 'resize';
    startX: number;
    initialStartDayOffset: number;
    initialDurationDays: number;
  } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Derive timeline anchor dynamically from earliest task date or today, shifted by user pan controls
  const baseDate = useMemo(() => {
    const candidateTimestamps: number[] = [];
    (project.points || []).forEach((pt) => {
      if (pt.startDate) {
        const t = new Date(pt.startDate).getTime();
        if (!Number.isNaN(t)) candidateTimestamps.push(t);
      }
      if (pt.targetDate) {
        const t = new Date(pt.targetDate).getTime() - 14 * 24 * 60 * 60 * 1000;
        if (!Number.isNaN(t)) candidateTimestamps.push(t);
      }
    });

    const anchor =
      candidateTimestamps.length > 0
        ? new Date(Math.min(...candidateTimestamps))
        : new Date();
    if (candidateTimestamps.length === 0) {
      anchor.setDate(anchor.getDate() - 7);
    } else {
      anchor.setDate(anchor.getDate() - 5);
    }
    anchor.setDate(anchor.getDate() + panOffsetDays);
    anchor.setHours(0, 0, 0, 0);
    return anchor;
  }, [project.points, panOffsetDays]);

  const timelineDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < zoomDays; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [baseDate, zoomDays]);

  const dayWidth = zoomDays <= 30 ? 44 : zoomDays <= 60 ? 28 : 18;

  const dateToOffset = (dateStr?: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - baseDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const offsetToDateStr = (offset: number) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

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

  const todayOffset = dateToOffset(todayStr);
  const todayLeftPx = todayOffset * dayWidth;

  const handleMouseDown = (
    e: React.MouseEvent,
    point: MatrixPoint,
    type: 'move' | 'resize'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultTargetOffset = todayOffset + 14;
    const targetOffset = point.targetDate ? dateToOffset(point.targetDate) : defaultTargetOffset;
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

      onUpdatePoint(project.id, dragState.pointId, {
        startDate: offsetToDateStr(newStartOffset),
        targetDate: offsetToDateStr(newTargetOffset)
      });
    } else if (dragState.type === 'resize') {
      const newDuration = Math.max(1, dragState.initialDurationDays + dayDelta);
      const newTargetOffset = dragState.initialStartDayOffset + newDuration;

      onUpdatePoint(project.id, dragState.pointId, {
        targetDate: offsetToDateStr(newTargetOffset)
      });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-600 text-white';
      case 'on-track':
        return 'bg-emerald-500 text-white';
      case 'in-progress':
        return 'bg-[#FFC20E] text-[#1F2328]';
      case 'at-risk':
      case 'delayed':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-[#3A3F45] text-white';
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F8F9] border border-gray-200 p-3.5 rounded-xl text-[#262A2E]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 pr-1">
            <Calendar className="w-4 h-4 text-[#262A2E]" />
            <span className="text-xs font-extrabold uppercase tracking-wider font-mono text-[#262A2E]">
              Gantt Schedule
            </span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-white border border-gray-200 text-[#262A2E] px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
          >
            <option value="all">All Dimensions ({allCategories.length})</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline items..."
            className="text-xs bg-white border border-gray-200 text-[#262A2E] px-3 py-1.5 rounded-lg placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFC20E] w-48"
          />
        </div>

        {/* Pan & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPanOffsetDays((d) => d - 7)}
              className="p-1 text-[#4B5563] hover:text-[#262A2E] hover:bg-[#F3F4F6] rounded cursor-pointer"
              title="Shift 1 week earlier"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPanOffsetDays(0)}
              className="px-2 py-0.5 text-[10px] font-mono font-bold text-[#3A3F45] hover:bg-[#F3F4F6] rounded cursor-pointer"
              title="Reset timeline window"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setPanOffsetDays((d) => d + 7)}
              className="p-1 text-[#4B5563] hover:text-[#262A2E] hover:bg-[#F3F4F6] rounded cursor-pointer"
              title="Shift 1 week later"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[10px] text-[#6B7280] font-mono uppercase ml-1">Zoom:</span>
          {[
            { days: 30, label: '30d' },
            { days: 60, label: '60d' },
            { days: 90, label: '90d' }
          ].map((z) => (
            <button
              key={z.days}
              type="button"
              onClick={() => setZoomDays(z.days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                zoomDays === z.days
                  ? 'bg-[#FFC20E] text-[#1F2328] shadow-xs'
                  : 'bg-white border border-gray-200 text-[#4B5563] hover:text-[#262A2E]'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* GANTT CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 260 + timelineDays.length * dayWidth }}>
            {/* TIMELINE CALENDAR HEADER */}
            <div className="flex border-b border-gray-200 bg-[#F7F8F9] sticky top-0 z-20">
              <div className="w-64 p-3 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[#4B5563] border-r border-gray-200 shrink-0 bg-[#F7F8F9] sticky left-0 z-30">
                Track Point / Dimension
              </div>

              <div className="flex relative">
                {timelineDays.map((date, idx) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isFirstOfMonth = date.getDate() === 1;
                  const isToday = date.toISOString().split('T')[0] === todayStr;

                  return (
                    <div
                      key={idx}
                      style={{ width: dayWidth }}
                      className={`text-center py-2 text-[10px] font-mono border-r border-gray-200 shrink-0 ${
                        isToday
                          ? 'bg-[#FFC20E] text-[#1F2328] font-black'
                          : isWeekend
                          ? 'bg-[#F3F4F6] text-[#9CA3AF]'
                          : 'text-[#4B5563]'
                      }`}
                    >
                      <span className="block text-[8px] uppercase opacity-75">
                        {date.toLocaleDateString([], { weekday: 'narrow' })}
                      </span>
                      <span
                        className={`block font-bold ${
                          isFirstOfMonth && !isToday ? 'underline font-black text-[#262A2E]' : ''
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TIMELINE ROWS */}
            <div className="divide-y divide-gray-100 relative">
              {todayOffset >= 0 && todayOffset < zoomDays && (
                <div
                  style={{ left: 256 + todayLeftPx + dayWidth / 2 }}
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                  title={`Today: ${todayStr}`}
                >
                  <div className="sticky top-12 -ml-6 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-mono font-bold rounded shadow-xs uppercase">
                    Today
                  </div>
                </div>
              )}

              {filteredPoints.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B7280]">
                  No points matching the active filter.
                </div>
              ) : (
                filteredPoints.map((point) => {
                  const fallbackTargetOffset = todayOffset + 14;
                  const targetOffset = point.targetDate
                    ? dateToOffset(point.targetDate)
                    : fallbackTargetOffset;
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
                      className="flex items-center hover:bg-[#F7F8F9]/60 transition-colors group"
                    >
                      {/* Left Point Info Card */}
                      <div
                        onClick={() => onSelectPoint(point)}
                        className="w-64 p-3 border-r border-gray-200 shrink-0 bg-white sticky left-0 z-20 cursor-pointer group-hover:bg-[#F7F8F9]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#3A3F45] border border-gray-200 truncate max-w-[140px]">
                            {point.category}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${getStatusBg(
                              point.status
                            )}`}
                          >
                            {point.status}
                          </span>
                        </div>
                        <p
                          className="text-xs font-bold text-[#262A2E] truncate mt-1 group-hover:underline"
                          title={point.title}
                        >
                          {point.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#6B7280] font-mono mt-1">
                          <span>{point.progressPercent}% complete</span>
                          <span>{assignedEmp ? assignedEmp.name : 'Unassigned'}</span>
                        </div>
                      </div>

                      {/* Timeline Bar Area */}
                      <div className="flex-1 relative py-3 h-16 flex items-center">
                        <div className="absolute inset-0 flex pointer-events-none">
                          {timelineDays.map((_, i) => (
                            <div
                              key={i}
                              style={{ width: dayWidth }}
                              className="border-r border-gray-100 h-full shrink-0"
                            />
                          ))}
                        </div>

                        <div
                          style={{
                            left: barLeft,
                            width: barWidth
                          }}
                          onMouseDown={(e) => handleMouseDown(e, point, 'move')}
                          className={`absolute h-8 rounded-lg shadow-xs border border-black/10 cursor-grab active:cursor-grabbing flex items-center overflow-hidden transition-all group/bar hover:ring-2 hover:ring-[#FFC20E] z-10 ${getStatusBg(
                            point.status
                          )}`}
                          title={`${point.title} (${point.startDate || 'Start'} -> ${
                            point.targetDate || 'TBD'
                          }) - Drag to reschedule`}
                        >
                          <div
                            style={{ width: `${point.progressPercent}%` }}
                            className="absolute left-0 top-0 bottom-0 bg-black/15 pointer-events-none"
                          />

                          <div className="relative px-2 flex items-center justify-between gap-1 w-full text-[11px] font-bold truncate">
                            <span className="truncate">{point.title}</span>
                            <span className="font-mono text-[9px] opacity-90 shrink-0">
                              {point.targetDate ? point.targetDate.slice(5) : ''}
                            </span>
                          </div>

                          <div
                            onMouseDown={(e) => handleMouseDown(e, point, 'resize')}
                            className="absolute right-0 top-0 bottom-0 w-2.5 bg-black/20 hover:bg-[#FFC20E] cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity"
                            title="Drag right handle to extend or shorten duration"
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

      <div className="text-[11px] text-[#6B7280] font-mono flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="flex items-center gap-1.5">
          <MoveHorizontal className="w-3.5 h-3.5 text-[#262A2E]" />
          <span>Drag any bar horizontally to shift dates, or drag the right edge to resize duration.</span>
        </span>
        <span className="font-semibold text-[#262A2E]">Today: {todayStr}</span>
      </div>
    </div>
  );
}
