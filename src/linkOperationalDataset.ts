/**
 * Converter and linker for operations datasets (such as File_to_link_16492beb.json)
 * Converts tasks, projects, users, bookings, safety records and SSQDCC items into AppState.
 */

import { 
  AppState, ProjectTrackRecord, MatrixPoint, Employee, 
  TaskTimeBooking, ActionItem, MetricWidget, Pillar, MatrixItemStatus 
} from './types';
import { INITIAL_STATE } from './seedData';

export interface RawOperationalData {
  version?: string;
  tasks?: Array<{
    id: string;
    task: string;
    owner?: string;
    category?: string;
    project?: string;
    status?: string;
    priority?: string | null;
    progress?: number;
    hours?: number;
    startDate?: string;
    dueDate?: string;
    notes?: string | null;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    manager?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    hours?: number;
    description?: string;
    progress?: number;
  }>;
  users?: Array<{
    name: string;
    capacity?: number;
  }>;
  bookings?: Array<{
    id: string;
    date: string;
    userId: string;
    targetId?: string;
    targetType?: string;
    hours: number;
    description?: string;
  }>;
  safetyStatus?: Record<string, {
    status?: string;
    notes?: string;
    safetyDaily?: string;
    supportRequired?: string;
    resultsAchieved?: string;
    teamSuggestions?: string;
  }>;
  ssqdcc_safety?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
  ssqdcc_sustainability?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
  ssqdcc_quality?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
  ssqdcc_delivery?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
  ssqdcc_cost?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
  ssqdcc_capital?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
  dailyAgenda?: Record<string, string>;
  dailyFollowUp?: Array<{ id: string; date?: string; text: string; completed?: boolean }>;
}

export function convertOperationalDataToAppState(raw: RawOperationalData, baseState: AppState = INITIAL_STATE): AppState {
  // 1. Employees / Users
  const employees: Employee[] = (raw.users || []).map((u, idx) => ({
    id: `emp-user-${idx + 1}`,
    name: u.name,
    monthlyAvailableHours: u.capacity && u.capacity > 0 ? u.capacity : 160
  }));

  const finalEmployees = employees.length > 0 ? employees : (baseState.employees || []);

  const getEmpIdByName = (name?: string): string | undefined => {
    if (!name) return undefined;
    const found = finalEmployees.find(e => e.name.toLowerCase().trim() === name.toLowerCase().trim());
    return found ? found.id : undefined;
  };

  // Helper: map status string to MatrixItemStatus
  const mapStatusToMatrixStatus = (statusStr?: string): MatrixItemStatus => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('complete')) return 'completed';
    if (s.includes('hold') || s.includes('block') || s.includes('delay')) return 'delayed';
    if (s.includes('risk')) return 'at-risk';
    if (s.includes('not started') || s.includes('new')) return 'not-started';
    if (s.includes('progress') || s.includes('active')) return 'in-progress';
    return 'on-track';
  };

  // Helper: map category to SSQDCC Pillar
  const mapCategoryToPillar = (cat?: string): Pillar => {
    const c = (cat || '').toLowerCase();
    if (c.includes('safe') || c.includes('ehs')) return 'Safety';
    if (c.includes('sust') || c.includes('env') || c.includes('eco')) return 'Sustainability';
    if (c.includes('qual') || c.includes('bom') || c.includes('audit')) return 'Quality';
    if (c.includes('cost') || c.includes('budget') || c.includes('spend')) return 'Cost';
    if (c.includes('cap') || c.includes('invest')) return 'Capital';
    return 'Delivery';
  };

  // 2. Projects & Project Matrices
  const rawProjects = raw.projects && raw.projects.length > 0 ? raw.projects : [];
  const rawTasks = raw.tasks || [];

  const projectMatrices: ProjectTrackRecord[] = rawProjects.map((p, idx) => {
    const empId = getEmpIdByName(p.manager);
    const relatedTasks = rawTasks.filter(t => t.project === p.id);
    
    // Convert related tasks to matrix points
    const points: MatrixPoint[] = relatedTasks.map((t, tIdx) => {
      const taskEmpId = getEmpIdByName(t.owner) || empId;
      return {
        id: t.id || `pt-${idx}-${tIdx}`,
        category: t.category || 'Task Wise Activity',
        title: t.task,
        description: t.notes || undefined,
        priority: (t.category === 'Priority' ? 'high' : 'medium') as 'low' | 'medium' | 'high' | 'critical',
        status: mapStatusToMatrixStatus(t.status),
        targetDate: t.dueDate || p.endDate || '2026-12-31',
        startDate: t.startDate || p.startDate || '2026-01-01',
        assignedToEmployeeId: taskEmpId,
        progressPercent: typeof t.progress === 'number' ? t.progress : t.status === 'Completed' ? 100 : 0,
        budget: (t.hours || 0) * 1000,
        costActual: (t.hours || 0) * 900,
        notes: t.notes || undefined,
        subPoints: []
      };
    });

    // If project has no direct linked tasks, generate default operational points based on project details
    if (points.length === 0) {
      points.push({
        id: `pt-${p.id}-init`,
        category: 'Scope',
        title: `${p.name} - Operational Scope & Baseline Setup`,
        priority: 'high',
        status: mapStatusToMatrixStatus(p.status),
        targetDate: p.endDate || '2026-12-31',
        startDate: p.startDate || '2026-01-01',
        assignedToEmployeeId: empId,
        progressPercent: p.progress || 0,
        budget: (p.hours || 50) * 1000,
        costActual: ((p.hours || 50) * (p.progress || 0) / 100) * 1000,
        notes: p.description || undefined,
        subPoints: []
      });
    }

    return {
      id: p.id,
      name: p.name,
      code: p.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || `PRJ-${idx + 1}`,
      description: p.description || undefined,
      owner: p.manager,
      ownerEmployeeId: empId,
      targetLaunchDate: p.endDate || undefined,
      startDate: p.startDate || undefined,
      overallStatus: (p.progress && p.progress >= 100 ? 'green' : 'amber') as 'green' | 'amber' | 'red',
      lastUpdated: new Date().toISOString().split('T')[0],
      customCategories: [
        'Priority', 
        'Short Term Project', 
        'Task Wise Activity', 
        'Support Required', 
        'Safety', 
        'Quality', 
        'Information & Team Suggestions'
      ],
      points
    };
  });

  const finalProjects: ProjectTrackRecord[] = projectMatrices.length > 0 ? projectMatrices : (baseState.projectMatrices || []);
  const activeProjectId = finalProjects.length > 0 ? finalProjects[0].id : 'prj-1';

  // 3. Action Items from Tasks & SSQDCC Items
  const actionItems: ActionItem[] = rawTasks.map((t) => ({
    id: t.id,
    pillar: mapCategoryToPillar(t.category),
    title: t.task,
    owner: t.owner || 'Operational Team',
    dueDate: t.dueDate || '2026-12-31',
    status: t.status === 'Completed' ? 'resolved' : t.status === 'In Progress' ? 'in-progress' : 'open',
    priority: t.category === 'Priority' ? 'high' : 'medium',
    notes: t.notes || (t.category ? `Category: ${t.category}` : undefined)
  }));

  // Append items from ssqdcc lists if available
  const addSSQDCCActions = (list?: Array<{ id: string; date?: string; text: string; completed?: boolean }>, pillar: Pillar = 'Safety') => {
    if (!list) return;
    list.forEach(item => {
      actionItems.push({
        id: item.id || `act-ssqdcc-${Date.now()}-${Math.random()}`,
        pillar,
        title: item.text,
        owner: 'Floor Champion',
        dueDate: item.date || '2026-10-31',
        status: item.completed ? 'resolved' : 'open',
        priority: 'high',
        notes: `SSQDCC ${pillar} Action`
      });
    });
  };

  addSSQDCCActions(raw.ssqdcc_safety, 'Safety');
  addSSQDCCActions(raw.ssqdcc_sustainability, 'Sustainability');
  addSSQDCCActions(raw.ssqdcc_quality, 'Quality');
  addSSQDCCActions(raw.ssqdcc_delivery, 'Delivery');
  addSSQDCCActions(raw.ssqdcc_cost, 'Cost');
  addSSQDCCActions(raw.ssqdcc_capital, 'Capital');

  // 4. Time Bookings
  const timeBookings: TaskTimeBooking[] = (raw.bookings || []).map((b) => {
    const matchedEmpId = getEmpIdByName(b.userId) || (finalEmployees[0] ? finalEmployees[0].id : 'emp-1');
    return {
      id: b.id,
      employeeId: matchedEmpId,
      taskTitle: b.description || 'Production Engineering & Assembly Support',
      plannedHours: b.hours || 0,
      actualHours: b.hours || 0,
      date: b.date
    };
  });

  // 5. Safety Cross & Notes
  const safetyNotes: Record<number, string> = {};
  const safetyCross: { [dayIndex: number]: 'green' | 'red' | 'amber' | 'none' } = {};
  
  for (let day = 1; day <= 31; day++) {
    const dayPad = day.toString().padStart(2, '0');
    let matchedStatus: 'green' | 'amber' | 'red' | 'none' = 'green';
    
    if (raw.safetyStatus) {
      for (const [dateStr, info] of Object.entries(raw.safetyStatus)) {
        if (dateStr.endsWith(`-${dayPad}`)) {
          if (info.status === 'red') matchedStatus = 'red';
          else if (info.status === 'amber') matchedStatus = 'amber';
          else if (info.status === 'green') matchedStatus = 'green';
          
          if (info.safetyDaily || info.notes || info.resultsAchieved) {
            safetyNotes[day] = [info.safetyDaily, info.notes, info.resultsAchieved].filter(Boolean).join(' | ');
          }
          break;
        }
      }
    }
    safetyCross[day] = matchedStatus;
  }

  // 6. Synchronized Project Matrix Metric Widgets for Daily Board
  const projectWidgets: MetricWidget[] = finalProjects.map((prj) => {
    const pts = prj.points || [];
    const totalProgress = pts.length > 0 
      ? Math.round(pts.reduce((sum, p) => sum + (p.progressPercent || 0), 0) / pts.length)
      : 0;

    return {
      id: `w-prj-${prj.id}`,
      title: prj.name,
      pillar: 'Cost',
      level: 'daily',
      type: 'projectMatrix',
      state: totalProgress < 50 && totalProgress > 0 ? 'red' : 'green',
      projectId: prj.id,
      owner: prj.owner || 'Project Lead',
      description: prj.description || `Live synced project tracking for ${prj.name} (${prj.code}).`
    };
  });

  // Combine non-project widgets with synced project widgets
  const existingNonProjectWidgets = baseState.widgets.filter(w => w.type !== 'projectMatrix');
  const allWidgets = [...projectWidgets, ...existingNonProjectWidgets];

  return {
    ...baseState,
    currentTeam: 'Epiroc Assembly & Rockdrill Operations',
    currentUserRole: 'Team Lead',
    employees: finalEmployees,
    projectMatrices: finalProjects,
    activeProjectId,
    actionItems: actionItems.length > 0 ? actionItems : baseState.actionItems,
    timeBookings: timeBookings.length > 0 ? timeBookings : (baseState.timeBookings || []),
    safetyCross,
    safetyNotes: Object.keys(safetyNotes).length > 0 ? safetyNotes : (baseState.safetyNotes || {}),
    widgets: allWidgets
  };
}
