import { MetricWidget, Deviation, ActionItem, AppState } from './types';

export const INITIAL_WIDGETS: MetricWidget[] = [
  // ================= DAILY LEVEL =================
  {
    id: 'd-safety-lti',
    title: 'Days Since Last LTI',
    pillar: 'Safety',
    level: 'daily',
    type: 'counter',
    value: 142,
    state: 'green',
    description: 'Number of operational days since the last Lost Time Injury (LTI).'
  },
  {
    id: 'd-safety-ppe',
    title: 'Daily PPE & Safety Audits',
    pillar: 'Safety',
    level: 'daily',
    type: 'checklist',
    state: 'green',
    description: 'Active PPE conformity verification on production lines.',
    checklist: [
      { id: 'ppe-1', label: 'Safety Glasses & Face Shields worn', checked: true },
      { id: 'ppe-2', label: 'Steel-toed boots in designated zones', checked: true },
      { id: 'ppe-3', label: 'Ear protection active near grinders', checked: true },
      { id: 'ppe-4', label: 'Lifting harnesses inspected', checked: true }
    ]
  },
  {
    id: 'd-safety-hazards',
    title: 'Daily Hazards Identified',
    pillar: 'Safety',
    level: 'daily',
    type: 'numeric',
    unit: 'Hazards',
    target: 0,
    actual: 1,
    state: 'red',
    description: 'New safety hazards or near-miss conditions spotted today.'
  },
  {
    id: 'd-sust-energy',
    title: 'Daily Energy Consumption',
    pillar: 'Sustainability',
    level: 'daily',
    type: 'numeric',
    unit: 'kWh',
    target: 400,
    actual: 445,
    warningThreshold: 110,
    state: 'red',
    description: 'Facility daily electricity consumption. Target based on lean efficiency.'
  },
  {
    id: 'd-sust-waste',
    title: 'Daily Waste Stream Sorting',
    pillar: 'Sustainability',
    level: 'daily',
    type: 'checklist',
    state: 'green',
    description: 'Compliance audits for sorting of hazardous vs recyclable scrap.',
    checklist: [
      { id: 'ws-1', label: 'Coolant filters sorted to hazardous bins', checked: true },
      { id: 'ws-2', label: 'Cardboard & plastic wrapping baled', checked: true },
      { id: 'ws-3', label: 'Machining chips cleaned from gutters', checked: true }
    ]
  },
  {
    id: 'd-quality-defects',
    title: 'Daily Defect Pareto Log',
    pillar: 'Quality',
    level: 'daily',
    type: 'chart',
    unit: 'defects',
    target: 4,
    actual: 9,
    state: 'red',
    description: 'Defects logged on the inspection station today.',
    dataPoints: [
      { label: 'Surface Scratch', value: 4, target: 1 },
      { label: 'Dimensional Error', value: 3, target: 1 },
      { label: 'Solder Crack', value: 2, target: 1 },
      { label: 'Label Misaligned', value: 0, target: 1 }
    ]
  },
  {
    id: 'd-quality-firstoff',
    title: 'First-Off Inspection Audits',
    pillar: 'Quality',
    level: 'daily',
    type: 'checklist',
    state: 'green',
    description: 'Initial unit verification before startup of each shift batch.',
    checklist: [
      { id: 'fo-1', label: 'Shift A first-off signoff', checked: true },
      { id: 'fo-2', label: 'Shift B first-off signoff', checked: true },
      { id: 'fo-3', label: 'Measurement jig calibrated', checked: true }
    ]
  },
  {
    id: 'd-delivery-throughput',
    title: 'Daily Line Throughput',
    pillar: 'Delivery',
    level: 'daily',
    type: 'numeric',
    unit: 'Units',
    target: 500,
    actual: 480,
    state: 'red',
    description: 'Completed products rolled off Assembly Line 2.'
  },
  {
    id: 'd-delivery-otif',
    title: 'OTIF (On-Time In-Full) Rate',
    pillar: 'Delivery',
    level: 'daily',
    type: 'gauge',
    unit: '%',
    target: 98,
    actual: 94.2,
    state: 'red',
    description: 'Orders shipped exactly on schedule and with correct item count.'
  },
  {
    id: 'd-cost-oee',
    title: 'Overall Equipment Effectiveness',
    pillar: 'Cost',
    level: 'daily',
    type: 'gauge',
    unit: '%',
    target: 85,
    actual: 78.5,
    state: 'red',
    description: 'Integrated metric for machine Availability, Performance, and Quality.'
  },
  {
    id: 'd-cost-downtime',
    title: 'Shift Unplanned Downtime',
    pillar: 'Cost',
    level: 'daily',
    type: 'numeric',
    unit: 'Minutes',
    target: 15,
    actual: 35,
    state: 'red',
    description: 'Minutes the CNC machines or conveyor lines were down unexpectedly.'
  },
  {
    id: 'd-capital-tools',
    title: 'Critical Spare Parts Capex',
    pillar: 'Capital',
    level: 'daily',
    type: 'numeric',
    unit: '$',
    target: 12000,
    actual: 10500,
    state: 'green',
    description: 'Daily operational capital spend on essential spare tool components.'
  },
  {
    id: 'd-support-sla',
    title: 'Support SLA Ticket Adherence',
    pillar: 'Delivery',
    level: 'daily',
    type: 'gauge',
    unit: '%',
    target: 95,
    actual: 91.5,
    state: 'red',
    description: 'Percentage of support tickets (IT, Procurement, Maintenance) resolved within target SLA windows.'
  },
  {
    id: 'd-support-audits',
    title: 'Safety Actions Closed <24h',
    pillar: 'Safety',
    level: 'daily',
    type: 'numeric',
    unit: '%',
    target: 100,
    actual: 92,
    state: 'red',
    description: 'Rate of corrective action closure within 24 hours of EHS hazard reports.'
  },
  {
    id: 'd-support-procedures',
    title: 'Support Preventive Checklist',
    pillar: 'Sustainability',
    level: 'daily',
    type: 'checklist',
    state: 'green',
    description: 'Daily administrative and facility waste elimination protocols completed.',
    checklist: [
      { id: 'proc-1', label: 'Procurement PO backlog review and dispute resolution', checked: true },
      { id: 'proc-2', label: 'Facilities hazardous waste storage area audit', checked: true },
      { id: 'proc-3', label: 'Daily cloud systems server backup verification', checked: true }
    ]
  },
  {
    id: 'd-delivery-stopwatch',
    title: 'Operator Standard Cycle Time Stopwatch',
    pillar: 'Delivery',
    level: 'daily',
    type: 'stopwatch',
    actual: 42,
    target: 45,
    state: 'green',
    description: 'Displays real-time cycle times against standard work takt. Warns if operator step exceeds standard.'
  },
  {
    id: 'd-cost-heatmap',
    title: '24-Hour Production OEE Machine Heatmap',
    pillar: 'Cost',
    level: 'daily',
    type: 'heatmap',
    state: 'green',
    description: 'Mini hourly heat grid showing machine running/uptime state over past 24 hours.'
  },
  {
    id: 'd-quality-pareto',
    title: 'Scrap & Waste Pareto Bar Chart',
    pillar: 'Quality',
    level: 'daily',
    type: 'pareto',
    state: 'red',
    description: 'A horizontal bar chart pinpointing active scrap sources on the shopfloor.'
  },
  {
    id: 'd-safety-skills',
    title: 'EHS & Assembly Skill Matrix Grid',
    pillar: 'Safety',
    level: 'daily',
    type: 'skills',
    state: 'green',
    description: 'Tracks supervisor and operator machinery cross-training certifications.'
  },
  {
    id: 'd-capital-kanban',
    title: 'Strategic CI Ideas Kanban',
    pillar: 'Capital',
    level: 'daily',
    type: 'kanban',
    state: 'green',
    description: 'Track team waste elimination ideas through stages: To Do, Testing, Standardized.'
  },
  {
    id: 'd-quality-handover',
    title: 'Supervisor Shift Handover Sign-off Block',
    pillar: 'Quality',
    level: 'daily',
    type: 'handover',
    state: 'green',
    description: 'Handover sign-off checklist and supervisor timestamp validation.'
  },
  {
    id: 'd-safety-risk',
    title: 'Active Floor Hazard Alert Index',
    pillar: 'Safety',
    level: 'daily',
    type: 'riskGauge',
    actual: 35,
    target: 70,
    state: 'green',
    description: 'Gauge dial showing shopfloor threat indexing based on active LOTO isolations.'
  },
  {
    id: 'd-sust-emissions',
    title: 'Shopfloor Carbon Emission Tracker',
    pillar: 'Sustainability',
    level: 'daily',
    type: 'emission',
    actual: 170,
    target: 150,
    warningThreshold: 110,
    state: 'red',
    description: 'Energy-equivalent CO2 output trace in kg compared to carbon footprint bounds.'
  },
  {
    id: 'd-sust-radar',
    title: 'Gemba Walk 5S Audit Radar',
    pillar: 'Sustainability',
    level: 'daily',
    type: 'radar',
    state: 'green',
    description: 'Interactively score Sort, Set, Shine, Standardize, and Sustain walkabouts.'
  },
  {
    id: 'd-delivery-countdown',
    title: 'Rig Packing Lead-Time Countdown',
    pillar: 'Delivery',
    level: 'daily',
    type: 'countdown',
    state: 'green',
    description: 'Progress milestone trail showing rig dispatch from factory to shipping bay.'
  },
  {
    id: 'd-delivery-pulse',
    title: 'Rig Takt-Time Heartbeat Pulsar',
    pillar: 'Delivery',
    level: 'daily',
    type: 'pulse',
    actual: 85,
    target: 80,
    state: 'green',
    description: 'Pulsing indicator reflecting whether assembly pace meets high customer demand.'
  }
];

export const INITIAL_DEVIATIONS: Deviation[] = [
  {
    id: 'dev-101',
    widgetId: 'd-safety-hazards',
    widgetTitle: 'Daily Hazards Identified',
    pillar: 'Safety',
    level: 'daily',
    date: '2026-10-01',
    description: 'Hydraulic oil leakage identified under Assembly Station 4. Slip hazard created.',
    fiveWhys: [
      'Why? Accumulation of oil on plant floor around Station 4.',
      'Why? O-ring seal failed on the hydraulic manifold pressure line.',
      'Why? High-pressure seal was not rated for high-temperature cycles.',
      'Why? Replacement seal sourced from local general catalog instead of OEM.',
      'Why? Maintenance stockout of genuine OEM heat-resistant seals.'
    ],
    rootCause: 'Maintenance stockout led to installation of an incorrect, sub-standard temporary seal.',
    actionItemId: 'act-201',
    isResolved: false,
    ishikawaCategory: 'Material'
  },
  {
    id: 'dev-102',
    widgetId: 'd-quality-defects',
    widgetTitle: 'Daily Defect Pareto Log',
    pillar: 'Quality',
    level: 'daily',
    date: '2026-09-30',
    description: 'Spike in "Surface Scratch" defects on extruded aluminum housings during Shift B.',
    fiveWhys: [
      'Why? Heavy surface scratches found on 8 out of 50 housings.',
      'Why? Unloading tray guide-rails were metal-on-metal with no protection pads.',
      'Why? The Teflon protective sleeves on the guide rails had worn completely away.',
      'Why? Guide rails were not included in the PM (Preventive Maintenance) checklist.',
      'Why? Line layout changed 3 months ago; PM schedules were not updated post-change.'
    ],
    rootCause: 'Guide-rail wear checklist was missing from regular preventive maintenance procedures post-layout changes.',
    actionItemId: 'act-202',
    isResolved: false,
    ishikawaCategory: 'Machine'
  },
  {
    id: 'dev-103',
    widgetId: 'd-sust-energy',
    widgetTitle: 'Daily Energy Consumption',
    pillar: 'Sustainability',
    level: 'daily',
    date: '2026-10-02',
    description: 'Energy spike of 435 kWh exceeded daily target of 400 kWh during inactive night shifts.',
    fiveWhys: [
      'Why? Power demand remained high (70 kW) even during plant shutdown hours.',
      'Why? CNC heating chambers and cooling loops left fully powered on overnight.',
      'Why? Operators skipped the shutdown checklist before leaving.',
      'Why? Shift handoff occurred 30 mins early due to transport schedule changes.',
      'Why? Early handoff guidelines omit standard verification of shutdown protocols.'
    ],
    rootCause: 'Lack of shutdown compliance check in early-shift handoff protocols.',
    actionItemId: 'act-203',
    isResolved: false,
    ishikawaCategory: 'Method'
  },
  {
    id: 'dev-104',
    widgetId: 'd-support-sla',
    widgetTitle: 'Support SLA Ticket Adherence',
    pillar: 'Delivery',
    level: 'daily',
    date: '2026-10-02',
    description: 'SLA dipped to 91.5% due to delayed Procurement releases of spare tooling orders.',
    fiveWhys: [
      'Why? Core PO approval stalled in the system.',
      'Why? Purchase requisition lacked signature from the regional safety auditor.',
      'Why? Auditor was off-site conducting safety walkthrough audits.',
      'Why? Approval workflow had no backup delegate assigned in the ERP.',
      'Why? Absence and delegate backup delegation SOP is missing from HR profiles.'
    ],
    rootCause: 'Lack of backup delegate assignment protocols in ERP purchase order approval workflows.',
    actionItemId: 'act-205',
    isResolved: false,
    ishikawaCategory: 'Method'
  }
];

export const INITIAL_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-201',
    pillar: 'Safety',
    title: 'Source & Restock OEM High-Temp Hydraulic Seals',
    owner: 'Sarah Connor',
    dueDate: '2026-10-05',
    priority: 'high',
    status: 'in-progress',
    deviationId: 'dev-101',
    notes: 'Approved premium shipping from OEM. Part numbers cross-referenced to prevent local generic substitutes.'
  },
  {
    id: 'act-202',
    pillar: 'Quality',
    title: 'Add Guide-Rail Teflon Checks to CNC Weekly PM Procedure',
    owner: 'Dave Miller',
    dueDate: '2026-10-04',
    priority: 'medium',
    status: 'open',
    deviationId: 'dev-102',
    notes: 'Draft updated SOP for PM and route to Engineering Manager for signoff.'
  },
  {
    id: 'act-203',
    pillar: 'Sustainability',
    title: 'Create Standard Shift Handoff Validation Board Checklist',
    owner: 'Carlos Ruiz',
    dueDate: '2026-10-06',
    priority: 'medium',
    status: 'open',
    deviationId: 'dev-103',
    notes: 'Add physical signature box on the huddle board for shift leaders to verify CNC low-power status before leaving.'
  },
  {
    id: 'act-204',
    pillar: 'Delivery',
    title: 'Inbound Material Shortage SLA Review',
    owner: 'Janice Lee',
    dueDate: '2026-10-12',
    priority: 'high',
    status: 'open',
    notes: 'Perform SLA review with the aluminum supplier regarding continuous shipping delays affecting OTIF.'
  },
  {
    id: 'act-205',
    pillar: 'Delivery',
    title: 'Map ERP Approval Backup Delegates in SOP',
    owner: 'HR & Procurement IT',
    dueDate: '2026-10-07',
    priority: 'high',
    status: 'open',
    deviationId: 'dev-104',
    notes: 'Design custom delegate fallback rules inside SAP workflow engine.'
  }
];

export const INITIAL_SAFETY_CROSS: { [dayIndex: number]: 'green' | 'red' | 'none' } = {
  1: 'green', 2: 'green', 3: 'green', 4: 'green', 5: 'green',
  6: 'green', 7: 'green', 8: 'green', 9: 'green', 10: 'green',
  11: 'green', 12: 'green', 13: 'green', 14: 'green', 15: 'green',
  16: 'green', 17: 'green', 18: 'green', 19: 'green', 20: 'green',
  21: 'green', 22: 'green', 23: 'green', 24: 'green', 25: 'green',
  26: 'green', 27: 'green', 28: 'green', 29: 'green', 30: 'red',
  31: 'none'
};

export const INITIAL_SAFETY_NOTES: { [dayIndex: number]: string } = {
  1: 'Shift startup briefing on eye protection completed.',
  15: 'All line fire extinguishers inspected and verified active.',
  30: 'Hydraulic oil leakage identified under Assembly Station 4. Slip hazard created and resolved.'
};

export const INITIAL_STATE: AppState = {
  currentTeam: 'Assembly Operations',
  currentUserRole: 'Team Lead',
  widgets: INITIAL_WIDGETS,
  deviations: INITIAL_DEVIATIONS,
  actionItems: INITIAL_ACTION_ITEMS,
  safetyCross: INITIAL_SAFETY_CROSS,
  safetyNotes: INITIAL_SAFETY_NOTES,
  history: {
    '2026-10-01': {
      widgets: INITIAL_WIDGETS.map(w => w.id === 'd-safety-lti' ? { ...w, value: 139 } : w),
      deviations: [],
      actionItems: [],
      safetyCross: { ...INITIAL_SAFETY_CROSS, 30: 'green' },
      safetyNotes: { ...INITIAL_SAFETY_NOTES, 30: 'No accidents logged today. Perfect shift compliance!' }
    },
    '2026-10-02': {
      widgets: INITIAL_WIDGETS.map(w => w.id === 'd-sust-energy' ? { ...w, actual: 435, state: 'red' } : w),
      deviations: [INITIAL_DEVIATIONS[1]],
      actionItems: [INITIAL_ACTION_ITEMS[2]],
      safetyCross: INITIAL_SAFETY_CROSS,
      safetyNotes: INITIAL_SAFETY_NOTES
    },
    '2026-10-03': {
      widgets: INITIAL_WIDGETS.map(w => w.id === 'd-safety-hazards' ? { ...w, actual: 1, state: 'red' } : w),
      deviations: [INITIAL_DEVIATIONS[0]],
      actionItems: [INITIAL_ACTION_ITEMS[0]],
      safetyCross: { ...INITIAL_SAFETY_CROSS, 29: 'amber' },
      safetyNotes: { ...INITIAL_SAFETY_NOTES, 29: 'Near-miss: Operator reported slick floor near hydraulic loop.' }
    }
  }
};

export const TEAMS_LIST = [
  'Assembly Operations',
  'CNC Machining & Tooling',
  'Logistics & Supply Chain',
  'Quality Assurance Lab',
  'Maintenance Support',
  'Procurement & Sourcing',
  'IT & Facilities Support',
  'EHS & HR Admin Support',
  'Executive Leadership'
];

export const ROLES_LIST = [
  'Team Lead',
  'Production Supervisor',
  'EHS Engineer (Safety)',
  'Quality Inspector',
  'Plant Manager',
  'Operator'
];
