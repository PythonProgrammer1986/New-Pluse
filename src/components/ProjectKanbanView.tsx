import React, { useState, useMemo } from 'react';
import { ProjectTrackRecord, MatrixPoint, MatrixItemStatus, Employee } from '../types';
import {
  Calendar,
  User,
  Pin,
  Paperclip,
  CheckSquare,
  Search,
  MoveHorizontal
} from 'lucide-react';

interface ProjectKanbanViewProps {
  project: ProjectTrackRecord;
  employees: Employee[];
  onUpdatePoint: (projectId: string, pointId: string, updates: Partial<MatrixPoint>) => void;
  onSelectPoint: (point: MatrixPoint) => void;
  onTogglePin?: (pointId: string) => void;
  allCategories: string[];
}

interface KanbanColumn {
  id: MatrixItemStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'not-started',
    title: 'Not Started',
    dotColor: 'bg-gray-400',
    badgeBg: 'bg-white text-[#4B5563] border border-gray-200'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    dotColor: 'bg-[#FFC20E]',
    badgeBg: 'bg-[#FFFBEB] text-[#1F2328] border border-[#FFC20E]'
  },
  {
    id: 'on-track',
    title: 'On Track',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  {
    id: 'at-risk',
    title: 'At Risk / Delayed',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200'
  },
  {
    id: 'completed',
    title: 'Completed',
    dotColor: 'bg-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300'
  }
];

export default function ProjectKanbanView({
  project,
  employees,
  onUpdatePoint,
  onSelectPoint,
  onTogglePin,
  allCategories
}: ProjectKanbanViewProps) {
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDragStart = (e: React.DragEvent, pointId: string) => {
    e.dataTransfer.setData('text/plain', pointId);
    setDraggedPointId(pointId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: MatrixItemStatus) => {
    e.preventDefault();
    const pointId = e.dataTransfer.getData('text/plain') || draggedPointId;
    if (!pointId) return;

    onUpdatePoint(project.id, pointId, {
      status: targetStatus,
      progressPercent: targetStatus === 'completed' ? 100 : undefined
    });
    setDraggedPointId(null);
  };

  const filteredPoints = useMemo(() => {
    if (!project.points) return [];
    return project.points.filter((pt) => {
      const matchCat = selectedCategory === 'all' || pt.category === selectedCategory;
      const matchPri = selectedPriority === 'all' || pt.priority === selectedPriority;
      const matchSearch =
        !searchQuery ||
        pt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pt.notes && pt.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchPri && matchSearch;
    });
  }, [project.points, selectedCategory, selectedPriority, searchQuery]);

  const getPriorityBadge = (pri: string) => {
    switch (pri) {
      case 'critical':
        return 'bg-rose-600 text-white';
      case 'high':
        return 'bg-[#FFC20E] text-[#1F2328]';
      case 'medium':
        return 'bg-[#3A3F45] text-white';
      default:
        return 'bg-[#F3F4F6] text-[#4B5563] border border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtering Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F8F9] border border-gray-200 p-3.5 rounded-xl text-[#262A2E]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-[#262A2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFC20E] w-48"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-white border border-gray-200 text-[#262A2E] px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
          >
            <option value="all">All Dimensions ({allCategories.length})</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-white border border-gray-200 text-[#262A2E] px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-[#6B7280] flex items-center gap-1.5">
          <MoveHorizontal className="w-3.5 h-3.5 text-[#262A2E]" />
          <span>Drag cards between columns to update status</span>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map((col) => {
          const colPoints = filteredPoints
            .filter((pt) => {
              if (col.id === 'at-risk') {
                return pt.status === 'at-risk' || pt.status === 'delayed';
              }
              return pt.status === col.id;
            })
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-[#F7F8F9] border border-gray-200 rounded-xl flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-white/60 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h4 className="text-xs font-extrabold text-[#262A2E] uppercase tracking-wider font-mono">
                    {col.title}
                  </h4>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${col.badgeBg}`}>
                  {colPoints.length}
                </span>
              </div>

              {/* Cards Droppable Scroll Area */}
              <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[280px]">
                {colPoints.map((point) => {
                  const assignedEmp = employees.find((e) => e.id === point.assignedToEmployeeId);
                  const completedSubCount = (point.subPoints || []).filter((s) => s.status === 'completed').length;
                  const totalSubCount = (point.subPoints || []).length;
                  const hasAttachments = point.attachments && point.attachments.length > 0;

                  return (
                    <div
                      key={point.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, point.id)}
                      onClick={() => onSelectPoint(point)}
                      className={`bg-white border rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-[#FFC20E] cursor-grab active:cursor-grabbing transition-all space-y-2.5 group relative ${
                        point.pinned ? 'border-[#FFC20E] ring-1 ring-[#FFC20E]/40' : 'border-gray-200'
                      } ${draggedPointId === point.id ? 'opacity-40 scale-95' : ''}`}
                    >
                      {/* Card Tags Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#F3F4F6] text-[#3A3F45] border border-gray-200 truncate max-w-[120px]">
                          {point.category}
                        </span>

                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${getPriorityBadge(
                              point.priority
                            )}`}
                          >
                            {point.priority}
                          </span>
                          {onTogglePin ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(point.id);
                              }}
                              className={`p-0.5 rounded transition-colors cursor-pointer ${
                                point.pinned
                                  ? 'text-[#E5AE00]'
                                  : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-[#262A2E]'
                              }`}
                              title={point.pinned ? 'Unpin card' : 'Pin card to top'}
                            >
                              <Pin className={`w-3 h-3 ${point.pinned ? 'fill-current' : ''}`} />
                            </button>
                          ) : (
                            point.pinned && <Pin className="w-3 h-3 text-[#E5AE00] fill-current" />
                          )}
                        </div>
                      </div>

                      {/* Card Title */}
                      <h5 className="text-xs font-bold text-[#262A2E] leading-snug group-hover:text-[#1F2328] transition-colors">
                        {point.title}
                      </h5>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-[#6B7280] mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-[#262A2E]">{point.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              point.progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#FFC20E]'
                            }`}
                            style={{ width: `${point.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Meta Footer */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-[#6B7280] font-mono">
                        <div className="flex items-center gap-1 truncate max-w-[100px]">
                          <User className="w-3 h-3 text-[#6B7280] shrink-0" />
                          <span className="truncate">{assignedEmp ? assignedEmp.name : 'Unassigned'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {totalSubCount > 0 && (
                            <span className="flex items-center gap-0.5" title="Subpoints completed">
                              <CheckSquare className="w-3 h-3 text-[#6B7280]" />
                              <span>
                                {completedSubCount}/{totalSubCount}
                              </span>
                            </span>
                          )}

                          {hasAttachments && (
                            <span className="flex items-center gap-0.5 text-[#B45309]" title="Attachments">
                              <Paperclip className="w-3 h-3" />
                              <span>{point.attachments?.length}</span>
                            </span>
                          )}

                          {point.targetDate && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3 text-[#6B7280]" />
                              <span>{point.targetDate.slice(5)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colPoints.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-gray-200 bg-white/50 rounded-xl flex items-center justify-center text-[#9CA3AF] text-[11px] font-mono">
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
