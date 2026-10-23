import React, { useState, useMemo } from 'react';
import { ProjectTrackRecord, MatrixPoint, MatrixItemStatus, Employee } from '../types';
import { 
  Plus, CheckCircle2, AlertCircle, Clock, Calendar, 
  User, Pin, Paperclip, CheckSquare, Search, Filter, 
  ArrowRight, Coins, Sparkles
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
  color: string;
  badgeBg: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'not-started', title: 'Not Started', color: 'border-slate-300 dark:border-slate-700', badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { id: 'in-progress', title: 'In Progress', color: 'border-amber-400 dark:border-amber-600', badgeBg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { id: 'on-track', title: 'On Track', color: 'border-blue-400 dark:border-blue-600', badgeBg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
  { id: 'at-risk', title: 'At Risk / Delayed', color: 'border-rose-400 dark:border-rose-600', badgeBg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
  { id: 'completed', title: 'Completed', color: 'border-emerald-400 dark:border-emerald-600', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' }
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

  // Drag and Drop Handlers
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

  // Filter Points
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
      case 'critical': return 'bg-rose-500 text-white';
      case 'high': return 'bg-amber-500 text-slate-950';
      case 'medium': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Filtering Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FFC20E] w-48"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none"
          >
            <option value="all">All Dimensions ({allCategories.length})</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl cursor-pointer focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <span>💡 Drag cards between columns to change status</span>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map((col) => {
          const colPoints = filteredPoints.filter((pt) => {
            if (col.id === 'at-risk') {
              return pt.status === 'at-risk' || pt.status === 'delayed';
            }
            return pt.status === col.id;
          });

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    col.id === 'completed' ? 'bg-emerald-500' :
                    col.id === 'at-risk' ? 'bg-rose-500' :
                    col.id === 'on-track' ? 'bg-blue-500' :
                    col.id === 'in-progress' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider font-mono">
                    {col.title}
                  </h4>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${col.badgeBg}`}>
                  {colPoints.length}
                </span>
              </div>

              {/* Cards Droppable Scroll Area */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[300px]">
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
                      className={`bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-400 cursor-grab active:cursor-grabbing transition-all space-y-2.5 group relative ${
                        draggedPointId === point.id ? 'opacity-40 scale-95' : ''
                      }`}
                    >
                      {/* Card Tags Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {point.category}
                        </span>

                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${getPriorityBadge(point.priority)}`}>
                            {point.priority}
                          </span>
                          {point.pinned && (
                            <Pin className="w-3 h-3 text-[#FFC20E] fill-current" />
                          )}
                        </div>
                      </div>

                      {/* Card Title */}
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 transition-colors">
                        {point.title}
                      </h5>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                          <span>Progress</span>
                          <span className="font-bold">{point.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              point.progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#FFC20E]'
                            }`}
                            style={{ width: `${point.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Meta Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1 truncate max-w-[100px]">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{assignedEmp ? assignedEmp.name : 'Unassigned'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {totalSubCount > 0 && (
                            <span className="flex items-center gap-0.5" title="Subpoints completed">
                              <CheckSquare className="w-3 h-3 text-slate-400" />
                              <span>{completedSubCount}/{totalSubCount}</span>
                            </span>
                          )}

                          {hasAttachments && (
                            <span className="flex items-center gap-0.5 text-amber-500" title="Attachments attached">
                              <Paperclip className="w-3 h-3" />
                              <span>{point.attachments?.length}</span>
                            </span>
                          )}

                          {point.targetDate && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{point.targetDate.slice(5)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {colPoints.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-[11px] font-mono">
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
