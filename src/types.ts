export type Pillar = 'Safety' | 'Sustainability' | 'Quality' | 'Delivery' | 'Cost' | 'Capital';
export type PulseLevel = 'daily' | 'weekly' | 'monthly';

export interface DataPoint {
  label: string;
  value: number;
  target?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  owner: string;
  dueDate: string;
}

export interface ExcelSyncRule {
  sheetName?: string;
  mode: 'date_lookup' | 'day_offset' | 'fixed_cell';
  dateColumn?: string; // e.g. "A"
  valueColumn?: string; // e.g. "B"
  cellCoordinate?: string; // e.g. "B12"
  headerOffset?: number; // e.g. 1
}

export type MatrixItemStatus = 'not-started' | 'in-progress' | 'on-track' | 'at-risk' | 'delayed' | 'completed';

export interface MatrixSubPoint {
  id: string;
  title: string;
  status: MatrixItemStatus;
  assignedToEmployeeId?: string; // ID from Resource Master
  dueDate?: string;
  notes?: string;
  costEstimate?: number;
  costActual?: number;
}

export interface MatrixPoint {
  id: string;
  category: string; // 'Cost' | 'Delivery or Schedule' | 'Scope' | 'Fixtures' | 'BOMs' | 'Resources' | 'Knowledge Transfer' | 'Prototype Schedule (Pre-productions)' | 'SOPs Breakdowns' | 'Challenges' | custom
  title: string;
  description?: string;
  status: MatrixItemStatus;
  assignedToEmployeeId?: string; // ID from Resource Master
  targetDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  progressPercent: number; // 0 - 100
  budget?: number;
  costActual?: number;
  notes?: string;
  subPoints: MatrixSubPoint[];
}

export interface ProjectTrackRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  targetLaunchDate?: string;
  overallStatus: 'green' | 'amber' | 'red';
  owner?: string; // Name of person who owns the project/metric
  ownerEmployeeId?: string; // Resource master ID
  points: MatrixPoint[];
  customCategories?: string[];
  lastUpdated?: string;
}

export interface MetricWidget {
  id: string;
  title: string;
  pillar: Pillar;
  level: PulseLevel;
  type: 'numeric' | 'checklist' | 'counter' | 'chart' | 'gauge' | 'project' | 'stopwatch' | 'heatmap' | 'pareto' | 'skills' | 'kanban' | 'handover' | 'riskGauge' | 'emission' | 'radar' | 'countdown' | 'pulse' | 'projectMatrix';
  unit?: string;
  target?: number;
  actual?: number;
  warningThreshold?: number; // threshold percentage, e.g. 110 for 110% of target
  value?: number; // generic value (like days in counters)
  state: 'green' | 'red';
  owner?: string; // Name of person who owns the metric
  ownerEmployeeId?: string; // Resource master ID
  description?: string;
  dataPoints?: DataPoint[]; // for charts/sparklines
  checklist?: ChecklistItem[]; // for checklist types
  milestones?: ProjectMilestone[]; // for capital projects or strategic targets
  linkedWidgetId?: string; // ID of the daily widget this widget is synchronized with
  excelRule?: ExcelSyncRule; // Custom Excel dynamic cell mapping rule
  projectId?: string; // For projectMatrix widget linking
}

export interface Deviation {
  id: string;
  widgetId: string;
  widgetTitle: string;
  pillar: Pillar;
  level: PulseLevel;
  date: string;
  description: string;
  fiveWhys?: string[]; // Array of exactly 5 strings
  rootCause?: string;
  actionItemId?: string; // Linked action item ID
  isResolved: boolean;
  ishikawaCategory?: 'Machine' | 'Method' | 'Manpower' | 'Material'; // Lean Ishikawa classification
  fundedAmount?: number; // Linked Strategic Capex funding
}

export interface ActionItem {
  id: string;
  pillar: Pillar;
  title: string;
  owner: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  deviationId?: string; // Linked deviation ID
  notes?: string;
}

export interface TeamConfig {
  id: string;
  name: string;
  members: string[];
}

export interface Employee {
  id: string;
  name: string;
  monthlyAvailableHours: number;
}

export interface TaskTimeBooking {
  id: string;
  employeeId: string;
  taskTitle: string;
  plannedHours: number;
  actualHours: number;
  date: string;
}

export interface AppStateSnapshot {
  widgets: MetricWidget[];
  deviations: Deviation[];
  actionItems: ActionItem[];
  safetyCross: { [dayIndex: number]: 'green' | 'red' | 'amber' | 'none' };
  safetyNotes: { [dayIndex: number]: string };
  employees?: Employee[];
  timeBookings?: TaskTimeBooking[];
  projectMatrices?: ProjectTrackRecord[];
  activeProjectId?: string;
}

export interface AppState {
  currentTeam: string;
  currentUserRole: string;
  widgets: MetricWidget[];
  deviations: Deviation[];
  actionItems: ActionItem[];
  safetyCross: { [dayIndex: number]: 'green' | 'red' | 'amber' | 'none' }; // for safety calendar (1-31)
  safetyNotes?: { [dayIndex: number]: string }; // Note-taking per calendar day
  employees?: Employee[];
  timeBookings?: TaskTimeBooking[];
  projectMatrices?: ProjectTrackRecord[];
  activeProjectId?: string;
  history?: { [dateString: string]: AppStateSnapshot };
}
