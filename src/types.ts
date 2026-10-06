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

export interface MetricWidget {
  id: string;
  title: string;
  pillar: Pillar;
  level: PulseLevel;
  type: 'numeric' | 'checklist' | 'counter' | 'chart' | 'gauge' | 'project' | 'stopwatch' | 'heatmap' | 'pareto' | 'skills' | 'kanban' | 'handover' | 'riskGauge' | 'emission' | 'radar' | 'countdown' | 'pulse';
  unit?: string;
  target?: number;
  actual?: number;
  warningThreshold?: number; // threshold percentage, e.g. 110 for 110% of target
  value?: number; // generic value (like days in counters)
  state: 'green' | 'red';
  description?: string;
  dataPoints?: DataPoint[]; // for charts/sparklines
  checklist?: ChecklistItem[]; // for checklist types
  milestones?: ProjectMilestone[]; // for capital projects or strategic targets
  linkedWidgetId?: string; // ID of the daily widget this widget is synchronized with
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
  history?: { [dateString: string]: AppStateSnapshot };
}
