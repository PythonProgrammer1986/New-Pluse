import React, { useState, useMemo } from 'react';
import { 
  ProjectTrackRecord, MatrixPoint, MatrixSubPoint, MatrixItemStatus, Employee 
} from '../types';
import { 
  Coins, Calendar, Target, Wrench, Boxes, Users, GraduationCap, 
  Rocket, FileText, AlertTriangle, Plus, Trash2, Edit2, Copy, 
  CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, 
  Filter, Search, Download, Check, X, User, ArrowUpRight, 
  Percent, ShieldAlert, Sparkles, FolderKanban, SlidersHorizontal,
  Layers, BarChart3, HelpCircle
} from 'lucide-react';

interface ProjectMatrixViewProps {
  projects: ProjectTrackRecord[];
  activeProjectId?: string;
  employees: Employee[];
  onSelectProject: (id: string) => void;
  onAddProject: (project: { name: string; code: string; description?: string; targetLaunchDate?: string }) => string;
  onUpdateProject: (id: string, updates: Partial<ProjectTrackRecord>) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onAddPoint: (projectId: string, point: Omit<MatrixPoint, 'id' | 'subPoints'> & { subPoints?: MatrixSubPoint[] }) => void;
  onUpdatePoint: (projectId: string, pointId: string, updates: Partial<MatrixPoint>) => void;
  onDeletePoint: (projectId: string, pointId: string) => void;
  onDuplicatePoint: (projectId: string, pointId: string) => void;
  onAddSubPoint: (projectId: string, pointId: string, subPoint: Omit<MatrixSubPoint, 'id'>) => void;
  onUpdateSubPoint: (projectId: string, pointId: string, subPointId: string, updates: Partial<MatrixSubPoint>) => void;
  onDeleteSubPoint: (projectId: string, pointId: string, subPointId: string) => void;
  onAddCustomCategory: (projectId: string, categoryName: string) => void;
  onDeleteCustomCategory: (projectId: string, categoryName: string) => void;
  onUpdateCustomCategory?: (projectId: string, oldName: string, newName: string) => void;
  onNavigateToResourceMaster?: () => void;
}

// Optional suggested dimensions for quick 1-click addition (NOT forced as mandatory defaults)
export const SUGGESTED_DIMENSIONS = [
  'Cost',
  'Delivery or Schedule',
  'Scope',
  'Fixtures',
  'BOMs',
  'Resources',
  'Knowledge Transfer',
  'Prototype Schedule (Pre-productions)',
  'SOPs Breakdowns',
  'Challenges'
];

export default function ProjectMatrixView({
  projects,
  activeProjectId,
  employees,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onDuplicateProject,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onDuplicatePoint,
  onAddSubPoint,
  onUpdateSubPoint,
  onDeleteSubPoint,
  onAddCustomCategory,
  onDeleteCustomCategory,
  onUpdateCustomCategory,
  onNavigateToResourceMaster
}: ProjectMatrixViewProps) {
  // Current active project
  const currentProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    if (activeProjectId) {
      const found = projects.find((p) => p.id === activeProjectId);
      if (found) return found;
    }
    return projects[0];
  }, [projects, activeProjectId]);

  // Filters state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [expandedPoints, setExpandedPoints] = useState<Record<string, boolean>>({});
  const [newSubPointInputs, setNewSubPointInputs] = useState<Record<string, string>>({});
  const [showAddPointModal, setShowAddPointModal] = useState<boolean>(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [editingPoint, setEditingPoint] = useState<MatrixPoint | null>(null);

  // Rename dimension state
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [renameCategoryInput, setRenameCategoryInput] = useState<string>('');
  const [quickDimensionInput, setQuickDimensionInput] = useState<string>('');

  // Delete confirmation modal state (safe in iframe, replaces window.confirm)
  const [deleteModal, setDeleteModal] = useState<{
    type: 'dimension' | 'point' | 'subpoint' | 'project';
    id: string;
    parentPointId?: string;
    title: string;
    details?: string;
  } | null>(null);

  // Modal forms
  const [formCategory, setFormCategory] = useState<string>('');
  const [formCustomCategoryInput, setFormCustomCategoryInput] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [formStatus, setFormStatus] = useState<MatrixItemStatus>('in-progress');
  const [formTargetDate, setFormTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAssignedEmpId, setFormAssignedEmpId] = useState<string>('');
  const [formBudget, setFormBudget] = useState<string>('');
  const [formCostActual, setFormCostActual] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Project modal form
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjLaunchDate, setNewProjLaunchDate] = useState('');
  const [newProjInitialDimensions, setNewProjInitialDimensions] = useState<string[]>([]);

  // Category modal form
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dynamic dimensions for active project (NOT a forced standard list!)
  const allCategories = useMemo(() => {
    if (!currentProject) return [];
    const hidden = (currentProject.hiddenCategories || []).map((h) => h.toLowerCase());
    const list: string[] = [];
    SUGGESTED_DIMENSIONS.forEach((d) => {
      if (!hidden.includes(d.toLowerCase()) && !list.includes(d)) {
        list.push(d);
      }
    });
    if (currentProject.customCategories && currentProject.customCategories.length > 0) {
      currentProject.customCategories.forEach((c) => {
        if (!hidden.includes(c.toLowerCase()) && !list.includes(c)) list.push(c);
      });
    }
    // Also include categories that already have points in this project
    if (currentProject.points && currentProject.points.length > 0) {
      currentProject.points.forEach((pt) => {
        if (pt.category && !hidden.includes(pt.category.toLowerCase()) && !list.includes(pt.category)) {
          list.push(pt.category);
        }
      });
    }
    return list;
  }, [currentProject]);

  // Toggle point expand
  const toggleExpand = (pointId: string) => {
    setExpandedPoints((prev) => ({
      ...prev,
      [pointId]: !prev[pointId]
    }));
  };

  const expandAll = () => {
    if (!currentProject) return;
    const next: Record<string, boolean> = {};
    currentProject.points.forEach((p) => {
      next[p.id] = true;
    });
    setExpandedPoints(next);
  };

  const collapseAll = () => {
    setExpandedPoints({});
  };

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cost':
        return Coins;
      case 'Delivery or Schedule':
        return Calendar;
      case 'Scope':
        return Target;
      case 'Fixtures':
        return Wrench;
      case 'BOMs':
        return Boxes;
      case 'Resources':
        return Users;
      case 'Knowledge Transfer':
        return GraduationCap;
      case 'Prototype Schedule (Pre-productions)':
        return Rocket;
      case 'SOPs Breakdowns':
        return FileText;
      case 'Challenges':
        return AlertTriangle;
      default:
        return Layers;
    }
  };

  // Status Styling
  const getStatusBadge = (status: MatrixItemStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500'
        };
      case 'on-track':
        return {
          label: 'On Track',
          bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
          dot: 'bg-green-500'
        };
      case 'in-progress':
        return {
          label: 'In Progress',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          dot: 'bg-blue-500'
        };
      case 'at-risk':
        return {
          label: 'At Risk',
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500'
        };
      case 'delayed':
        return {
          label: 'Delayed / Blocker',
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500'
        };
      case 'not-started':
      default:
        return {
          label: 'Not Started',
          bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          dot: 'bg-slate-400'
        };
    }
  };

  // Priority Styling
  const getPriorityBadge = (priority: 'low' | 'medium' | 'high' | 'critical') => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  // Calculate Metrics
  const summaryMetrics = useMemo(() => {
    if (!currentProject) return null;
    const points = currentProject.points;
    const totalPoints = points.length;
    let totalSubPoints = 0;
    let completedSubPoints = 0;
    let totalBudget = 0;
    let totalActual = 0;
    let completedPoints = 0;
    let atRiskCount = 0;

    points.forEach((p) => {
      if (p.status === 'completed') completedPoints++;
      if (p.status === 'at-risk' || p.status === 'delayed') atRiskCount++;
      if (p.budget) totalBudget += p.budget;
      if (p.costActual) totalActual += p.costActual;
      if (p.subPoints) {
        totalSubPoints += p.subPoints.length;
        completedSubPoints += p.subPoints.filter((s) => s.status === 'completed').length;
      }
    });

    const overallProgress =
      totalPoints > 0
        ? Math.round(
            (points.reduce((acc, p) => acc + (p.progressPercent || 0), 0) / (totalPoints * 100)) * 100
          )
        : 0;

    // Operational requirements completion (% of Fixtures, BOMs, SOPs, Prototypes done)
    const opPoints = points.filter((p) =>
      ['Fixtures', 'BOMs', 'Resources', 'Knowledge Transfer', 'Prototype Schedule (Pre-productions)', 'SOPs Breakdowns'].includes(
        p.category
      )
    );
    const opCompleted = opPoints.filter((p) => p.status === 'completed').length;
    const opReadiness = opPoints.length > 0 ? Math.round((opCompleted / opPoints.length) * 100) : 0;

    // Cost variance
    const costVariance = totalBudget - totalActual;
    const costVariancePercent = totalBudget > 0 ? ((costVariance / totalBudget) * 100).toFixed(1) : '0';

    return {
      totalPoints,
      completedPoints,
      totalSubPoints,
      completedSubPoints,
      overallProgress,
      totalBudget,
      totalActual,
      costVariance,
      costVariancePercent,
      atRiskCount,
      opReadiness
    };
  }, [currentProject]);

  // Employee allocations map
  const employeeTaskCounts = useMemo(() => {
    if (!currentProject) return {};
    const map: Record<string, { total: number; completed: number; name: string }> = {};

    employees.forEach((emp) => {
      map[emp.id] = { total: 0, completed: 0, name: emp.name };
    });

    currentProject.points.forEach((pt) => {
      if (pt.assignedToEmployeeId && map[pt.assignedToEmployeeId]) {
        map[pt.assignedToEmployeeId].total += 1;
        if (pt.status === 'completed') map[pt.assignedToEmployeeId].completed += 1;
      }
      pt.subPoints?.forEach((sub) => {
        if (sub.assignedToEmployeeId && map[sub.assignedToEmployeeId]) {
          map[sub.assignedToEmployeeId].total += 1;
          if (sub.status === 'completed') map[sub.assignedToEmployeeId].completed += 1;
        }
      });
    });

    return map;
  }, [currentProject, employees]);

  // Filtered Points
  const filteredPoints = useMemo(() => {
    if (!currentProject) return [];
    return currentProject.points.filter((pt) => {
      // Category filter
      if (selectedCategoryFilter !== 'all' && pt.category !== selectedCategoryFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && pt.status !== selectedStatusFilter) {
        return false;
      }
      // Employee filter
      if (selectedEmployeeFilter !== 'all') {
        const matchesParent = pt.assignedToEmployeeId === selectedEmployeeFilter;
        const matchesSub = pt.subPoints?.some((s) => s.assignedToEmployeeId === selectedEmployeeFilter);
        if (!matchesParent && !matchesSub) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = pt.title.toLowerCase().includes(query);
        const matchesDesc = (pt.description || '').toLowerCase().includes(query);
        const matchesNotes = (pt.notes || '').toLowerCase().includes(query);
        const matchesSub = pt.subPoints?.some(
          (s) => s.title.toLowerCase().includes(query) || (s.notes || '').toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDesc && !matchesNotes && !matchesSub) return false;
      }
      return true;
    });
  }, [currentProject, selectedCategoryFilter, selectedStatusFilter, selectedEmployeeFilter, searchQuery]);

  // Group filtered points by category
  const pointsByCategory = useMemo(() => {
    const map: Record<string, MatrixPoint[]> = {};
    allCategories.forEach((cat) => {
      map[cat] = [];
    });

    filteredPoints.forEach((pt) => {
      if (!map[pt.category]) {
        map[pt.category] = [];
      }
      map[pt.category].push(pt);
    });

    return map;
  }, [filteredPoints, allCategories]);

  // Handle Quick Add Sub-point
  const handleAddSubPointQuick = (pointId: string) => {
    const title = (newSubPointInputs[pointId] || '').trim();
    if (!title || !currentProject) return;

    onAddSubPoint(currentProject.id, pointId, {
      title,
      status: 'in-progress'
    });

    setNewSubPointInputs((prev) => ({ ...prev, [pointId]: '' }));
    // Auto expand point
    setExpandedPoints((prev) => ({ ...prev, [pointId]: true }));
  };

  // Open Edit Point Modal
  const handleOpenEdit = (pt: MatrixPoint) => {
    setEditingPoint(pt);
    setFormCategory(pt.category);
    setFormTitle(pt.title);
    setFormDesc(pt.description || '');
    setFormPriority(pt.priority);
    setFormStatus(pt.status);
    setFormTargetDate(pt.targetDate || new Date().toISOString().split('T')[0]);
    setFormAssignedEmpId(pt.assignedToEmployeeId || '');
    setFormBudget(pt.budget ? pt.budget.toString() : '');
    setFormCostActual(pt.costActual ? pt.costActual.toString() : '');
    setFormNotes(pt.notes || '');
    setShowAddPointModal(true);
  };

  // Open Create Point Modal
  const handleOpenCreatePoint = (categoryPrefill?: string) => {
    setEditingPoint(null);
    let initialCat = '';
    if (categoryPrefill) {
      initialCat = categoryPrefill;
    } else if (selectedCategoryFilter !== 'all') {
      initialCat = selectedCategoryFilter;
    } else if (allCategories.length > 0) {
      initialCat = allCategories[0];
    } else {
      initialCat = '__NEW__';
    }
    setFormCategory(initialCat);
    setFormCustomCategoryInput(initialCat === '__NEW__' ? '' : '');
    setFormTitle('');
    setFormDesc('');
    setFormPriority('high');
    setFormStatus('in-progress');
    setFormTargetDate(new Date().toISOString().split('T')[0]);
    setFormAssignedEmpId(employees.length > 0 ? employees[0].id : '');
    setFormBudget('');
    setFormCostActual('');
    setFormNotes('');
    setShowAddPointModal(true);
  };

  // Submit Point Form (Add or Edit)
  const handleSubmitPointForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !formTitle.trim()) return;

    let finalCategory = formCategory;
    if (formCategory === '__NEW__' || !formCategory.trim()) {
      finalCategory = formCustomCategoryInput.trim() || 'General';
    }

    // Register dimension with project if not already present
    if (finalCategory && !allCategories.includes(finalCategory)) {
      onAddCustomCategory(currentProject.id, finalCategory);
    }

    const budgetVal = formBudget ? parseFloat(formBudget) : undefined;
    const costActualVal = formCostActual ? parseFloat(formCostActual) : undefined;

    if (editingPoint) {
      onUpdatePoint(currentProject.id, editingPoint.id, {
        category: finalCategory,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        priority: formPriority,
        status: formStatus,
        targetDate: formTargetDate || undefined,
        assignedToEmployeeId: formAssignedEmpId || undefined,
        budget: budgetVal,
        costActual: costActualVal,
        notes: formNotes.trim() || undefined
      });
    } else {
      onAddPoint(currentProject.id, {
        category: finalCategory,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        priority: formPriority,
        status: formStatus,
        targetDate: formTargetDate || undefined,
        assignedToEmployeeId: formAssignedEmpId || undefined,
        progressPercent: formStatus === 'completed' ? 100 : 0,
        budget: budgetVal,
        costActual: costActualVal,
        notes: formNotes.trim() || undefined,
        subPoints: []
      });
    }

    setShowAddPointModal(false);
    setEditingPoint(null);
  };

  // Submit New Project Form
  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjCode.trim()) return;

    const newId = onAddProject({
      name: newProjName.trim(),
      code: newProjCode.trim().toUpperCase(),
      description: newProjDesc.trim() || undefined,
      targetLaunchDate: newProjLaunchDate || undefined
    });

    // If PM selected initial dimensions, add them
    if (newProjInitialDimensions.length > 0) {
      newProjInitialDimensions.forEach((dim) => {
        onAddCustomCategory(newId, dim);
      });
    }

    onSelectProject(newId);
    setNewProjName('');
    setNewProjCode('');
    setNewProjDesc('');
    setNewProjLaunchDate('');
    setNewProjInitialDimensions([]);
    setShowNewProjectModal(false);
  };

  // Submit Custom Category / Dimension
  const handleSubmitNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newCategoryName.trim()) return;
    onAddCustomCategory(currentProject.id, newCategoryName.trim());
    setSelectedCategoryFilter(newCategoryName.trim());
    setNewCategoryName('');
    setShowAddCategoryModal(false);
  };

  // Quick add dimension from suggestions
  const handleQuickAddDimension = (dimensionName: string) => {
    if (!currentProject || !dimensionName.trim()) return;
    onAddCustomCategory(currentProject.id, dimensionName.trim());
    setSelectedCategoryFilter(dimensionName.trim());
  };

  // Save renamed dimension
  const handleSaveRenameCategory = (oldCategory: string) => {
    if (!currentProject || !renameCategoryInput.trim()) return;
    if (onUpdateCustomCategory) {
      onUpdateCustomCategory(currentProject.id, oldCategory, renameCategoryInput.trim());
    }
    if (selectedCategoryFilter === oldCategory) {
      setSelectedCategoryFilter(renameCategoryInput.trim());
    }
    setEditingCategoryName(null);
    setRenameCategoryInput('');
  };

  // Export Matrix to CSV
  const handleExportCSV = () => {
    if (!currentProject) return;
    const rows = [
      ['Project Code', currentProject.code],
      ['Project Name', currentProject.name],
      ['Target Launch Date', currentProject.targetLaunchDate || 'N/A'],
      ['Export Date', new Date().toISOString().split('T')[0]],
      [],
      [
        'Dimension / Category',
        'Point Title',
        'Priority',
        'Status',
        'Progress (%)',
        'Target Date',
        'Allocated Employee',
        'Budget (₹ INR)',
        'Actual Spend (₹ INR)',
        'Notes',
        'Sub-Point Title',
        'Sub-Point Status',
        'Sub-Point Assigned To',
        'Sub-Point Due Date'
      ]
    ];

    currentProject.points.forEach((pt) => {
      const emp = employees.find((e) => e.id === pt.assignedToEmployeeId);
      const empName = emp ? emp.name : 'Unassigned';

      if (!pt.subPoints || pt.subPoints.length === 0) {
        rows.push([
          pt.category,
          pt.title,
          pt.priority,
          pt.status,
          `${pt.progressPercent}%`,
          pt.targetDate || '',
          empName,
          pt.budget?.toString() || '',
          pt.costActual?.toString() || '',
          pt.notes || '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        pt.subPoints.forEach((sub, sIdx) => {
          const subEmp = employees.find((e) => e.id === sub.assignedToEmployeeId);
          const subEmpName = subEmp ? subEmp.name : 'Unassigned';
          rows.push([
            sIdx === 0 ? pt.category : '',
            sIdx === 0 ? pt.title : '',
            sIdx === 0 ? pt.priority : '',
            sIdx === 0 ? pt.status : '',
            sIdx === 0 ? `${pt.progressPercent}%` : '',
            sIdx === 0 ? pt.targetDate || '' : '',
            sIdx === 0 ? empName : '',
            sIdx === 0 ? pt.budget?.toString() || '' : '',
            sIdx === 0 ? pt.costActual?.toString() || '' : '',
            sIdx === 0 ? pt.notes || '' : '',
            sub.title,
            sub.status,
            subEmpName,
            sub.dueDate || ''
          ]);
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(item => `"${(item || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentProject.code}_Project_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <FolderKanban className="w-12 h-12 text-[#FFC20E] mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">No Project Matrix Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Create your first project tracking matrix to monitor Cost, Schedule, Scope, and Operational Requirements.
        </p>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2 bg-[#FFC20E] text-slate-950 font-bold text-xs rounded-lg shadow-sm hover:brightness-105 cursor-pointer uppercase tracking-wider"
        >
          Create Project Tracker
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Project Selector & Control Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#FFC20E] text-slate-950 tracking-wider">
                {currentProject.code}
              </span>
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                {currentProject.name}
              </h2>
              {/* Overall status clickable selector */}
              <select
                value={currentProject.overallStatus}
                onChange={(e) =>
                  onUpdateProject(currentProject.id, {
                    overallStatus: e.target.value as 'green' | 'amber' | 'red'
                  })
                }
                className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border cursor-pointer uppercase ${
                  currentProject.overallStatus === 'green'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                    : currentProject.overallStatus === 'amber'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                    : 'bg-rose-950/60 text-rose-300 border-rose-700'
                }`}
              >
                <option value="green">🟢 Project Healthy</option>
                <option value="amber">🟡 Needs Attention</option>
                <option value="red">🔴 Critical Escalation</option>
              </select>

              {/* Project Lead / Owner Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
                <User className="w-3.5 h-3.5 text-[#FFC20E]" />
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Lead:</span>
                <select
                  value={currentProject.ownerEmployeeId || ''}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    onUpdateProject(currentProject.id, {
                      ownerEmployeeId: e.target.value || undefined,
                      owner: emp ? emp.name : undefined
                    });
                  }}
                  className="bg-transparent text-xs font-bold font-mono text-white focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- Assign Lead --
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                      👤 {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {currentProject.description && (
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                {currentProject.description}
              </p>
            )}
          </div>

          {/* Project Switcher & Top Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
              <FolderKanban className="w-3.5 h-3.5 text-[#FFC20E]" />
              <select
                value={currentProject.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Create new project tracker"
            >
              <Plus className="w-3.5 h-3.5 text-[#FFC20E]" />
              New Project
            </button>

            <button
              onClick={() => onDuplicateProject(currentProject.id)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clone current project tracker"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              Clone
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Export complete matrix to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export
            </button>

            {projects.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setDeleteModal({
                    type: 'project',
                    id: currentProject.id,
                    title: `Delete Project Tracker "${currentProject.name}"`,
                    details: 'Are you sure you want to delete this entire project tracker? This cannot be undone.'
                  });
                }}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs rounded-lg transition-colors cursor-pointer"
                title="Delete project tracker"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Executive Metrics Ribbon */}
        {summaryMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-5">
            {/* Overall Progress */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Overall Progress
              </span>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-[#FFC20E]">
                    {summaryMetrics.overallProgress}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {summaryMetrics.completedPoints}/{summaryMetrics.totalPoints} points
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FFC20E] h-full rounded-full transition-all duration-300"
                    style={{ width: `${summaryMetrics.overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cost Budget vs Spend */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total Budget vs Actual
              </span>
              <div className="mt-1">
                <div className="text-base font-black font-mono text-white">
                  ₹{summaryMetrics.totalActual.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
                  <span className="text-slate-400">Budget: ₹{summaryMetrics.totalBudget.toLocaleString('en-IN')}</span>
                  <span
                    className={`font-bold ${
                      summaryMetrics.costVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {summaryMetrics.costVariance >= 0 ? '+' : ''}
                    {summaryMetrics.costVariancePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Readiness */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Operational Readiness
              </span>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {summaryMetrics.opReadiness}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fixtures & BOMs & SOPs
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${summaryMetrics.opReadiness}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sub-Points Granularity */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Sub-Points Execution
              </span>
              <div className="mt-1">
                <div className="text-base font-black font-mono text-white">
                  {summaryMetrics.completedSubPoints} / {summaryMetrics.totalSubPoints}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {summaryMetrics.totalSubPoints > 0
                    ? `${Math.round((summaryMetrics.completedSubPoints / summaryMetrics.totalSubPoints) * 100)}% checklist resolved`
                    : 'No sub-points yet'}
                </div>
              </div>
            </div>

            {/* Target Launch Date */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Launch Target Date
              </span>
              <div className="mt-1">
                <div className="text-sm font-bold font-mono text-white">
                  {currentProject.targetLaunchDate || 'TBD'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Pre-productions deadline
                </div>
              </div>
            </div>

            {/* Active Challenges / Risks */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Blockers & At-Risk
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className={`text-xl font-black font-mono ${
                    summaryMetrics.atRiskCount > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {summaryMetrics.atRiskCount}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-800">
                  Daily Attention
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Team Allocation Workload Chips (Resource Master Integration) */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#FFC20E]" />
            Resource Master Allocations:
          </span>
          {employees.map((emp) => {
            const countInfo = employeeTaskCounts[emp.id] || { total: 0, completed: 0 };
            const isSelected = selectedEmployeeFilter === emp.id;
            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployeeFilter(isSelected ? 'all' : emp.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#FFC20E] text-slate-950 border-[#FFC20E] shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title={`Filter tasks allocated to ${emp.name}`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-900 text-[#FFC20E] text-[10px] font-black flex items-center justify-center">
                  {emp.name.charAt(0)}
                </span>
                <span>{emp.name}</span>
                <span
                  className={`text-[10px] font-bold px-1 rounded ${
                    isSelected ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {countInfo.total}
                </span>
              </button>
            );
          })}
          {selectedEmployeeFilter !== 'all' && (
            <button
              onClick={() => setSelectedEmployeeFilter('all')}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer ml-1"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search points, fixtures, BOMs, sub-tasks, SOPs, challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & Priority Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="on-track">On Track</option>
                <option value="in-progress">In Progress</option>
                <option value="at-risk">At Risk</option>
                <option value="delayed">Delayed / Blocked</option>
                <option value="completed">Completed</option>
                <option value="not-started">Not Started</option>
              </select>
            </div>

            {/* Expand / Collapse All buttons */}
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Expand all sub-points"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Collapse all sub-points"
            >
              Collapse All
            </button>

            {/* Add Point Main Button */}
            <button
              onClick={() => handleOpenCreatePoint()}
              className="px-3.5 py-1.5 bg-[#FFC20E] text-slate-950 hover:brightness-105 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Add Tracking Point
            </button>

            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Add custom section"
            >
              <Plus className="w-3.5 h-3.5 text-[#FFC20E]" />
              New Section
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-[#FFC20E] dark:bg-[#FFC20E] dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Dimensions ({filteredPoints.length})
          </button>

          {allCategories.map((cat) => {
            const count = (currentProject.points || []).filter((p) => p.category === cat).length;
            const Icon = getCategoryIcon(cat);
            const isSelected = selectedCategoryFilter === cat;
            return (
              <div
                key={cat}
                className="inline-flex items-center rounded-lg shadow-xs overflow-hidden border border-slate-200 dark:border-slate-700/80"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-[#FFC20E] dark:bg-[#FFC20E] dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal({
                      type: 'dimension',
                      id: cat,
                      title: `Delete Dimension "${cat}"`,
                      details: `This will remove the "${cat}" dimension and all ${count} tracking point(s) inside it. Project Manager can add it back anytime as per requirement.`
                    });
                  }}
                  className={`px-1.5 py-1 text-xs transition-all cursor-pointer border-l ${
                    isSelected
                      ? 'bg-slate-900 text-slate-400 hover:text-rose-400 border-slate-800 dark:bg-[#FFC20E] dark:text-slate-900 dark:hover:text-rose-700 dark:border-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700'
                  }`}
                  title={`Delete dimension "${cat}"`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer bg-amber-500/10 text-[#FFC20E] hover:bg-amber-500/20 border border-amber-500/30 whitespace-nowrap"
            title="Add dimension as per requirement"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dimension</span>
          </button>
        </div>

        {/* Dimension Quick-Add Ribbon (Project Manager can add dimensions as per requirement) */}
        {currentProject && SUGGESTED_DIMENSIONS.filter((d) => !allCategories.includes(d)).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFC20E]" />
              Quick Add Dimensions:
            </span>
            {SUGGESTED_DIMENSIONS.filter((dim) => !allCategories.includes(dim)).map((dim) => (
              <button
                key={dim}
                onClick={() => handleQuickAddDimension(dim)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 hover:bg-[#FFC20E] text-slate-700 dark:text-slate-300 dark:bg-slate-800/80 hover:text-slate-950 dark:hover:bg-[#FFC20E] dark:hover:text-slate-950 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                title={`Click to add "${dim}" to this project`}
              >
                <Plus className="w-2.5 h-2.5" />
                {dim}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Matrix Categories Breakdown View */}
      <div className="space-y-6">
        {allCategories.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#FFC20E]/15 text-[#FFC20E] mx-auto flex items-center justify-center">
              <Layers className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                No Dimensions Configured Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Standard dimensions are not forced. As Project Manager, configure the tracking dimensions tailored to your project requirements (e.g. Cost, Delivery, Scope, Fixtures, BOMs, SOPs).
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto pt-2">
              {SUGGESTED_DIMENSIONS.map((dim) => (
                <button
                  key={dim}
                  onClick={() => handleQuickAddDimension(dim)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-[#FFC20E] hover:text-slate-950 dark:hover:bg-[#FFC20E] dark:hover:text-slate-950 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FFC20E]" />
                  {dim}
                </button>
              ))}
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-2 bg-[#FFC20E] text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow hover:brightness-105 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Custom Dimension
              </button>
            </div>
          </div>
        ) : (
          allCategories.map((category) => {
            const categoryPoints = pointsByCategory[category] || [];
            if (selectedCategoryFilter !== 'all' && selectedCategoryFilter !== category) {
              return null;
            }
            if (selectedCategoryFilter === 'all' && categoryPoints.length === 0 && searchQuery) {
              return null;
            }

            const CategoryIcon = getCategoryIcon(category);
            const completedCount = categoryPoints.filter((p) => p.status === 'completed').length;
            const isEditingCategory = editingCategoryName === category;

            return (
              <div
                key={category}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Category Header */}
                <div className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-[#FFC20E] flex items-center justify-center shadow-sm">
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      {isEditingCategory ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveRenameCategory(category);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={renameCategoryInput}
                            onChange={(e) => setRenameCategoryInput(e.target.value)}
                            className="px-2 py-1 text-xs font-bold rounded bg-white dark:bg-slate-800 border border-[#FFC20E] text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryName(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                            {category}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingCategoryName(category);
                              setRenameCategoryInput(category);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                            title="Rename dimension"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {completedCount} of {categoryPoints.length} points completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCreatePoint(category)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FFC20E]" />
                      Add {category} Point
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModal({
                          type: 'dimension',
                          id: category,
                          title: `Delete Dimension "${category}"`,
                          details: `This will remove the "${category}" dimension and all ${categoryPoints.length} tracking point(s) in this dimension. Project manager can add it back anytime as per requirement.`
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title={`Delete dimension "${category}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Points List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-3 sm:p-5 space-y-4">
                {categoryPoints.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400">
                      No points added in <span className="font-bold text-slate-700 dark:text-slate-300">{category}</span> yet.
                    </p>
                    <button
                      onClick={() => handleOpenCreatePoint(category)}
                      className="mt-2 text-xs font-bold text-[#FFC20E] hover:underline cursor-pointer"
                    >
                      + Add first item in {category}
                    </button>
                  </div>
                ) : (
                  categoryPoints.map((point) => {
                    const statusBadge = getStatusBadge(point.status);
                    const priorityClass = getPriorityBadge(point.priority);
                    const isExpanded = !!expandedPoints[point.id];
                    const assignedEmployee = employees.find((e) => e.id === point.assignedToEmployeeId);
                    const subPointsCount = point.subPoints?.length || 0;
                    const completedSubs = point.subPoints?.filter((s) => s.status === 'completed').length || 0;

                    return (
                      <div
                        key={point.id}
                        className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
                      >
                        {/* Header Row: Title, Priority, Status, Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Priority tag */}
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${priorityClass}`}
                              >
                                {point.priority}
                              </span>

                              {/* Title */}
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                {point.title}
                              </h4>

                              {/* Metric Point Owner Badge */}
                              {assignedEmployee ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#FFC20E]/15 text-[#9a7008] dark:text-[#FFC20E] border border-[#FFC20E]/40" title={`Point Owner: ${assignedEmployee.name}`}>
                                  <User className="w-3 h-3" />
                                  <span>Owner: {assignedEmployee.name}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  <User className="w-3 h-3" />
                                  <span>Unassigned</span>
                                </span>
                              )}
                            </div>

                            {point.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {point.description}
                              </p>
                            )}
                          </div>

                          {/* Status Pill & Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Interactive Status Selector */}
                            <select
                              value={point.status}
                              onChange={(e) =>
                                onUpdatePoint(currentProject.id, point.id, {
                                  status: e.target.value as MatrixItemStatus
                                })
                              }
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer uppercase transition-all ${statusBadge.bg}`}
                            >
                              <option value="on-track">🟢 On Track</option>
                              <option value="in-progress">🔵 In Progress</option>
                              <option value="at-risk">🟡 At Risk</option>
                              <option value="delayed">🔴 Delayed / Blocker</option>
                              <option value="completed">✅ Completed</option>
                              <option value="not-started">⚪ Not Started</option>
                            </select>

                            {/* Point Actions Menu */}
                            <button
                              onClick={() => handleOpenEdit(point)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Edit Point details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDuplicatePoint(currentProject.id, point.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Duplicate Point"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteModal({
                                  type: 'point',
                                  id: point.id,
                                  title: `Delete Point "${point.title}"`,
                                  details: `Are you sure you want to delete this tracking point? All associated specifications and ${(point.subPoints || []).length} sub-tasks will be permanently deleted.`
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Point"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Meta Ribbon: Due Date, Allocated Person, Budget, Progress Slider */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                          {/* Allocated Resource (Resource Master Dropdown) */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80">
                            <User className="w-3.5 h-3.5 text-[#FFC20E] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">
                                Assigned Resource
                              </span>
                              <select
                                value={point.assignedToEmployeeId || ''}
                                onChange={(e) =>
                                  onUpdatePoint(currentProject.id, point.id, {
                                    assignedToEmployeeId: e.target.value || undefined
                                  })
                                }
                                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
                              >
                                <option value="" className="bg-white dark:bg-slate-800 text-slate-400">
                                  -- Unassigned --
                                </option>
                                {employees.map((emp) => (
                                  <option
                                    key={emp.id}
                                    value={emp.id}
                                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                                  >
                                    👤 {emp.name} ({emp.monthlyAvailableHours}h/mo)
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Target Due Date */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">
                                Target Date
                              </span>
                              <input
                                type="date"
                                value={point.targetDate || ''}
                                onChange={(e) =>
                                  onUpdatePoint(currentProject.id, point.id, {
                                    targetDate: e.target.value || undefined
                                  })
                                }
                                className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Budget & Spend */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80">
                            <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">
                                Budget / Actual
                              </span>
                              <div className="flex items-baseline gap-1.5 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                <span>₹{(point.costActual || 0).toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-slate-400">
                                  / ₹{(point.budget || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Controls */}
                          <div className="bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                              <span>Progress</span>
                              <span className="font-mono text-[#FFC20E] font-bold">
                                {point.progressPercent || 0}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={point.progressPercent || 0}
                                onChange={(e) =>
                                  onUpdatePoint(currentProject.id, point.id, {
                                    progressPercent: parseInt(e.target.value) || 0
                                  })
                                }
                                className="w-full accent-[#FFC20E] cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Point Notes preview */}
                        {point.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-500/5 dark:bg-amber-400/5 border-l-2 border-[#FFC20E] px-2.5 py-1.5 rounded-r">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Notes: </span>
                            {point.notes}
                          </div>
                        )}

                        {/* Sub-Points Interactive Section */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleExpand(point.id)}
                              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#FFC20E] transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[#FFC20E]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>
                                Sub-Points Breakdown ({completedSubs}/{subPointsCount})
                              </span>
                            </button>

                            <button
                              onClick={() => toggleExpand(point.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono cursor-pointer"
                            >
                              {isExpanded ? 'Hide' : 'Show & Add Sub-tasks'}
                            </button>
                          </div>

                          {/* Collapsible Sub-points Content */}
                          {isExpanded && (
                            <div className="mt-3 space-y-2.5 pl-2 sm:pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                              {point.subPoints && point.subPoints.length > 0 ? (
                                <div className="space-y-1.5">
                                  {point.subPoints.map((sub) => {
                                    const subStatusBadge = getStatusBadge(sub.status);
                                    const isDone = sub.status === 'completed';

                                    return (
                                      <div
                                        key={sub.id}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg border text-xs transition-all ${
                                          isDone
                                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-slate-500 dark:text-slate-400 line-through'
                                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                          {/* Completion toggle checkmark */}
                                          <button
                                            onClick={() =>
                                              onUpdateSubPoint(currentProject.id, point.id, sub.id, {
                                                status: isDone ? 'in-progress' : 'completed'
                                              })
                                            }
                                            className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                                              isDone
                                                ? 'bg-emerald-500 border-emerald-600 text-white'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-[#FFC20E]'
                                            }`}
                                          >
                                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                                          </button>

                                          {/* Sub-point title (editable inline) */}
                                          <input
                                            type="text"
                                            value={sub.title}
                                            onChange={(e) =>
                                              onUpdateSubPoint(currentProject.id, point.id, sub.id, {
                                                title: e.target.value
                                              })
                                            }
                                            className="bg-transparent font-medium flex-1 focus:outline-none focus:ring-1 focus:ring-[#FFC20E] px-1 rounded"
                                          />
                                        </div>

                                        {/* Sub-point metadata & Resource allocation */}
                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                          {/* Allocated Employee Selector for Sub-point */}
                                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                            <User className="w-3 h-3 text-[#FFC20E]" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Owner:</span>
                                            <select
                                              value={sub.assignedToEmployeeId || ''}
                                              onChange={(e) =>
                                                onUpdateSubPoint(currentProject.id, point.id, sub.id, {
                                                  assignedToEmployeeId: e.target.value || undefined
                                                })
                                              }
                                              className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[130px] truncate"
                                            >
                                              <option value="" className="bg-white dark:bg-slate-800">
                                                -- Unassigned --
                                              </option>
                                              {employees.map((emp) => (
                                                <option
                                                  key={emp.id}
                                                  value={emp.id}
                                                  className="bg-white dark:bg-slate-800"
                                                >
                                                  {emp.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          {/* Sub-point Due Date */}
                                          <input
                                            type="date"
                                            value={sub.dueDate || ''}
                                            onChange={(e) =>
                                              onUpdateSubPoint(currentProject.id, point.id, sub.id, {
                                                dueDate: e.target.value || undefined
                                              })
                                            }
                                            className="bg-transparent text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded"
                                          />

                                          {/* Sub-point Status selector */}
                                          <select
                                            value={sub.status}
                                            onChange={(e) =>
                                              onUpdateSubPoint(currentProject.id, point.id, sub.id, {
                                                status: e.target.value as MatrixItemStatus
                                              })
                                            }
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer uppercase ${subStatusBadge.bg}`}
                                          >
                                            <option value="in-progress">In Progress</option>
                                            <option value="on-track">On Track</option>
                                            <option value="at-risk">At Risk</option>
                                            <option value="delayed">Delayed</option>
                                            <option value="completed">Done</option>
                                            <option value="not-started">Not Started</option>
                                          </select>

                                          {/* Delete sub-point button */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteModal({
                                                type: 'subpoint',
                                                id: sub.id,
                                                parentPointId: point.id,
                                                title: `Delete Sub-point "${sub.title}"`,
                                                details: 'Are you sure you want to delete this sub-task checklist item?'
                                              });
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer shrink-0"
                                            title="Delete sub-point"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">
                                  No sub-points defined yet. Add immediate action steps below.
                                </p>
                              )}

                              {/* Quick Add Sub-point Input */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Add new sub-point or task... (e.g. 'Order pneumatic clamp fixture', 'Sign-off SOP draft')"
                                  value={newSubPointInputs[point.id] || ''}
                                  onChange={(e) =>
                                    setNewSubPointInputs((prev) => ({
                                      ...prev,
                                      [point.id]: e.target.value
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubPointQuick(point.id);
                                    }
                                  }}
                                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E] placeholder:text-slate-400"
                                />
                                <button
                                  onClick={() => handleAddSubPointQuick(point.id)}
                                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-[#FFC20E] font-bold text-xs rounded-lg hover:brightness-110 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add Sub-point
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* Modal: Add / Edit Tracking Point */}
      {showAddPointModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFC20E] text-slate-950 flex items-center justify-center font-black">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {editingPoint ? 'Edit Tracking Point' : 'Add New Matrix Point'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddPointModal(false);
                  setEditingPoint(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPointForm} className="space-y-4 text-xs">
              {/* Category & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Dimension / Category *
                  </label>
                  {allCategories.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__NEW__">➕ Add New Dimension...</option>
                      </select>

                      {formCategory === '__NEW__' && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            required
                            placeholder="Type new dimension name (e.g. Fixtures, BOMs, Scope)..."
                            value={formCustomCategoryInput}
                            onChange={(e) => setFormCustomCategoryInput(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#FFC20E] bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-semibold focus:outline-none"
                            autoFocus
                          />
                          <div className="flex flex-wrap gap-1">
                            {SUGGESTED_DIMENSIONS.filter(d => !allCategories.includes(d)).slice(0, 4).map(dim => (
                              <button
                                type="button"
                                key={dim}
                                onClick={() => setFormCustomCategoryInput(dim)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#FFC20E] hover:text-slate-950 font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                              >
                                + {dim}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cost, Delivery, Scope, Fixtures, BOMs..."
                        value={formCustomCategoryInput}
                        onChange={(e) => setFormCustomCategoryInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-400 font-medium self-center">Suggestions:</span>
                        {SUGGESTED_DIMENSIONS.slice(0, 5).map((dim) => (
                          <button
                            type="button"
                            key={dim}
                            onClick={() => setFormCustomCategoryInput(dim)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#FFC20E] hover:text-slate-950 font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            + {dim}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Priority Level *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  >
                    <option value="critical">🔴 Critical Escalation</option>
                    <option value="high">🟠 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">⚪ Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Point Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic Clamping Nest Alignment & GR&R Study"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-bold placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Description / Specification
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide technical specifics, tooling dimensions, criteria or scope details..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] placeholder:text-slate-400"
                />
              </div>

              {/* Status, Target Date & Allocated Person */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MatrixItemStatus)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  >
                    <option value="on-track">🟢 On Track</option>
                    <option value="in-progress">🔵 In Progress</option>
                    <option value="at-risk">🟡 At Risk</option>
                    <option value="delayed">🔴 Delayed / Blocker</option>
                    <option value="completed">✅ Completed</option>
                    <option value="not-started">⚪ Not Started</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Allocated Resource *
                  </label>
                  <select
                    value={formAssignedEmpId}
                    onChange={(e) => setFormAssignedEmpId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold"
                  >
                    <option value="">-- Unassigned --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        👤 {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget & Actual Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Allocated Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="100"
                    placeholder="e.g. 250000"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                    Actual Spend / Committed (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="100"
                    placeholder="e.g. 218000"
                    value={formCostActual}
                    onChange={(e) => setFormCostActual(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Daily Huddle Notes / Mitigation Steps
                </label>
                <textarea
                  rows={2}
                  placeholder="Status update, blocker explanations, next steps for team huddle..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] placeholder:text-slate-400"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {editingPoint ? (
                  <button
                    type="button"
                    onClick={() => {
                      const ptToDelete = editingPoint;
                      setShowAddPointModal(false);
                      setEditingPoint(null);
                      setDeleteModal({
                        type: 'point',
                        id: ptToDelete.id,
                        title: `Delete Point "${ptToDelete.title}"`,
                        details: `Are you sure you want to delete this tracking point? All associated specifications and ${(ptToDelete.subPoints || []).length} sub-tasks will be permanently deleted.`
                      });
                    }}
                    className="px-3 py-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Point
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPointModal(false);
                      setEditingPoint(null);
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FFC20E] hover:brightness-105 text-slate-950 font-black rounded-lg transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    {editingPoint ? 'Save Point Changes' : 'Create Tracking Point'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Project Tracker */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFC20E] text-slate-950 flex items-center justify-center font-black">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Create New Project Tracker
                </h3>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Project Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EPI-HYD-2026"
                  value={newProjCode}
                  onChange={(e) => setNewProjCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Hydraulic Power Unit Line Expansion"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Target Launch / SOP Date
                </label>
                <input
                  type="date"
                  value={newProjLaunchDate}
                  onChange={(e) => setNewProjLaunchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Scope Summary / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of targets, capacity goals, and operational boundaries..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                />
              </div>

              {/* Initial Dimensions (Optional) */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Initial Dimensions (Optional)
                </label>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Standard dimensions are not forced. Check any initial dimensions you need, or configure them later:
                </p>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-850">
                  {SUGGESTED_DIMENSIONS.map((dim) => {
                    const isChecked = newProjInitialDimensions.includes(dim);
                    return (
                      <label
                        key={dim}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProjInitialDimensions([...newProjInitialDimensions, dim]);
                            } else {
                              setNewProjInitialDimensions(newProjInitialDimensions.filter((d) => d !== dim));
                            }
                          }}
                          className="accent-[#FFC20E] rounded"
                        />
                        <span className="truncate">{dim}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FFC20E] text-slate-950 font-black rounded-lg cursor-pointer uppercase tracking-wider hover:brightness-105"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Custom Section / Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Add Project Matrix Dimension
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Dimension Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cost, Delivery, Scope, Fixtures, BOMs, Logistics..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-bold"
                  autoFocus
                />
              </div>

              {SUGGESTED_DIMENSIONS.filter((d) => !allCategories.includes(d)).length > 0 && (
                <div>
                  <span className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                    Quick Add Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_DIMENSIONS.filter((d) => !allCategories.includes(d)).map((dim) => (
                      <button
                        type="button"
                        key={dim}
                        onClick={() => setNewCategoryName(dim)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-[#FFC20E] text-slate-700 dark:text-slate-300 dark:bg-slate-800 hover:text-slate-950 dark:hover:bg-[#FFC20E] dark:hover:text-slate-950 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                      >
                        + {dim}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FFC20E] text-slate-950 font-black rounded-lg cursor-pointer uppercase tracking-wider"
                >
                  Add Dimension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Delete Confirmation Modal (NO window.confirm, works in iframe) */}
      {deleteModal && currentProject && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                  {deleteModal.title}
                </h3>
                {deleteModal.details && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {deleteModal.details}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 rounded-xl p-3 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                {deleteModal.type === 'dimension' && 'This dimension and all its points will be deleted. Project manager can re-add it whenever needed.'}
                {deleteModal.type === 'point' && 'This tracking point and its sub-points will be deleted.'}
                {deleteModal.type === 'subpoint' && 'This sub-point action item will be deleted.'}
                {deleteModal.type === 'project' && 'This project tracker record will be permanently deleted.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteModal.type === 'dimension') {
                    onDeleteCustomCategory(currentProject.id, deleteModal.id);
                    if (selectedCategoryFilter === deleteModal.id) {
                      setSelectedCategoryFilter('all');
                    }
                  } else if (deleteModal.type === 'point') {
                    onDeletePoint(currentProject.id, deleteModal.id);
                  } else if (deleteModal.type === 'subpoint' && deleteModal.parentPointId) {
                    onDeleteSubPoint(currentProject.id, deleteModal.parentPointId, deleteModal.id);
                  } else if (deleteModal.type === 'project') {
                    onDeleteProject(deleteModal.id);
                  }
                  setDeleteModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
