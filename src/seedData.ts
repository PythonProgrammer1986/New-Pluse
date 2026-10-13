import { MetricWidget, Deviation, ActionItem, AppState, ProjectTrackRecord } from './types';

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
    owner: 'John Doe',
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
    owner: 'John Doe',
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
    owner: 'Sarah Connor',
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
    owner: 'Sarah Connor',
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
    owner: 'Ellen Ripley',
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
    owner: 'Ellen Ripley',
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
    owner: 'Alex Murphy',
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
    owner: 'Alex Murphy',
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
    owner: 'Sarah Connor',
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
    owner: 'Sarah Connor',
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
    owner: 'John Doe',
    unit: '₹',
    target: 120000,
    actual: 105000,
    state: 'green',
    description: 'Daily operational capital spend on essential spare tool components in INR (₹).'
  },
  {
    id: 'd-capital-proj-matrix',
    title: 'Drill Rig Automation Project Matrix',
    pillar: 'Capital',
    level: 'daily',
    type: 'projectMatrix',
    owner: 'Ellen Ripley',
    state: 'green',
    projectId: 'prj-1',
    description: 'Interactive Cost, Schedule, Scope, and Operational Requirements (Fixtures, BOMs, Resources, SOPs) tracking matrix.'
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

export const INITIAL_EMPLOYEES = [
  { id: 'emp-1', name: 'John Doe', monthlyAvailableHours: 160 },
  { id: 'emp-2', name: 'Sarah Connor', monthlyAvailableHours: 160 },
  { id: 'emp-3', name: 'Alex Murphy', monthlyAvailableHours: 120 },
  { id: 'emp-4', name: 'Ellen Ripley', monthlyAvailableHours: 180 }
];

export const INITIAL_TIME_BOOKINGS = [
  { id: 'book-1', employeeId: 'emp-1', taskTitle: 'Audit PPE & Safety compliance on line 1', plannedHours: 10, actualHours: 8, date: '2026-10-01' },
  { id: 'book-2', employeeId: 'emp-2', taskTitle: 'Machining coolant level reset and cleaning', plannedHours: 15, actualHours: 16, date: '2026-10-02' },
  { id: 'book-3', employeeId: 'emp-3', taskTitle: 'Calibrate measurement micrometer jigs', plannedHours: 8, actualHours: 8, date: '2026-10-03' },
  { id: 'book-4', employeeId: 'emp-4', taskTitle: 'Emergency response drill and evacuation log', plannedHours: 12, actualHours: 10, date: '2026-10-04' }
];

export const INITIAL_PROJECT_MATRICES: ProjectTrackRecord[] = [
  {
    id: 'prj-1',
    name: 'Smart Drill Rig Automation & Cell Upgrade',
    code: 'EPI-PRJ-2026-04',
    description: 'Lean operational execution of the automated assembly cell, tooling fixtures, robotic torque stations, and pre-production validation.',
    targetLaunchDate: '2026-12-15',
    overallStatus: 'green',
    owner: 'Ellen Ripley',
    ownerEmployeeId: 'emp-4',
    lastUpdated: '2026-10-13',
    customCategories: [
      'Cost',
      'Delivery or Schedule',
      'Scope',
      'Fixtures',
      'BOMs',
      'Resources',
      'Knowledge Transfer',
      'Prototype Schedule (Pre-productions)',
      'SOPs Breakdowns',
      'Challenges',
      'Vendor Management',
      'EHS Compliance'
    ],
    points: [
      // 1. COST
      {
        id: 'pt-cost-1',
        category: 'Cost',
        title: 'Capital Equipment & Tooling CapEx',
        description: 'Primary capital investment budget for cell robotics, test bench sensors, and dedicated jigs.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-2', // Sarah Connor
        targetDate: '2026-11-20',
        priority: 'critical',
        progressPercent: 85,
        budget: 450000,
        costActual: 418000,
        notes: 'Currently ₹32,000 under budget; final payment pending acceptance test.',
        subPoints: [
          { id: 'sub-cost-1-1', title: 'Sensor Integration & Vision Package PO', status: 'completed', assignedToEmployeeId: 'emp-2', costEstimate: 85000, costActual: 82000, dueDate: '2026-10-01' },
          { id: 'sub-cost-1-2', title: 'PLC Controller Panels & Safe-Torque Hardware', status: 'completed', assignedToEmployeeId: 'emp-2', costEstimate: 140000, costActual: 138000, dueDate: '2026-10-10' },
          { id: 'sub-cost-1-3', title: 'Machine Guarding & Safety Light Curtains', status: 'in-progress', assignedToEmployeeId: 'emp-3', costEstimate: 65000, costActual: 62000, dueDate: '2026-10-25' }
        ]
      },
      {
        id: 'pt-cost-2',
        category: 'Cost',
        title: 'Operational Readiness & Ramp-Up OpEx',
        description: 'Contractor hours, specialized tooling calibration, and team certification costs.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-1', // John Doe
        targetDate: '2026-12-05',
        priority: 'high',
        progressPercent: 70,
        budget: 68000,
        costActual: 51200,
        notes: 'Travel and integration labor within targeted operational reserve.',
        subPoints: [
          { id: 'sub-cost-2-1', title: 'Vendor Field Engineering Support (40 hrs)', status: 'completed', assignedToEmployeeId: 'emp-1', costEstimate: 22000, costActual: 20500, dueDate: '2026-10-05' },
          { id: 'sub-cost-2-2', title: 'Operator Ergonomic Assessment & PPE gear', status: 'in-progress', assignedToEmployeeId: 'emp-4', costEstimate: 12000, costActual: 8400, dueDate: '2026-10-30' }
        ]
      },

      // 2. DELIVERY OR SCHEDULE
      {
        id: 'pt-del-1',
        category: 'Delivery or Schedule',
        title: 'Station 1-4 Mechanical Installation Milestone',
        description: 'Physical anchoring, pneumatic drops, and safety barrier integration.',
        status: 'completed',
        assignedToEmployeeId: 'emp-3', // Alex Murphy
        targetDate: '2026-10-10',
        priority: 'critical',
        progressPercent: 100,
        notes: 'Completed 2 days ahead of master schedule with zero punch list items.',
        subPoints: [
          { id: 'sub-del-1-1', title: 'Anchor bolts drilling & epoxy cure tests', status: 'completed', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-03' },
          { id: 'sub-del-1-2', title: 'Gantry frame laser leveling & vibration dampening', status: 'completed', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-08' }
        ]
      },
      {
        id: 'pt-del-2',
        category: 'Delivery or Schedule',
        title: 'Line Commissioning & Dry-Cycle Run Milestone',
        description: 'Continuous dry cycling for 120 consecutive cycles without micro-stops.',
        status: 'in-progress',
        assignedToEmployeeId: 'emp-4', // Ellen Ripley
        targetDate: '2026-11-15',
        priority: 'high',
        progressPercent: 60,
        notes: 'Dry cycle currently achieving 98.4% uptime across first 60 cycles.',
        subPoints: [
          { id: 'sub-del-2-1', title: 'Pneumatics line pressure holding test', status: 'completed', assignedToEmployeeId: 'emp-4', dueDate: '2026-10-08' },
          { id: 'sub-del-2-2', title: 'Emergency stop circuit SIL-3 verification', status: 'in-progress', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-22' },
          { id: 'sub-del-2-3', title: 'Master takt time benchmark (target <= 180s)', status: 'not-started', assignedToEmployeeId: 'emp-4', dueDate: '2026-11-10' }
        ]
      },

      // 3. SCOPE
      {
        id: 'pt-scp-1',
        category: 'Scope',
        title: 'Automated Torque Fastening System Requirements',
        description: 'Smart DC tools with traceable angle and torque logging to MES database.',
        status: 'completed',
        assignedToEmployeeId: 'emp-2', // Sarah Connor
        targetDate: '2026-10-05',
        priority: 'high',
        progressPercent: 100,
        notes: 'Transducer accuracy validated within ±1.2% over 500 test cycles.',
        subPoints: [
          { id: 'sub-scp-1-1', title: 'Wireless transducer Ethernet/IP handshake', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-09-28' },
          { id: 'sub-scp-1-2', title: 'Batch torque tightening curve profile storage', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-04' }
        ]
      },
      {
        id: 'pt-scp-2',
        category: 'Scope',
        title: 'Vision Inspection Station for O-Ring Seating',
        description: 'High-res industrial camera for detecting missing or twisted hydraulic seals.',
        status: 'in-progress',
        assignedToEmployeeId: 'emp-1', // John Doe
        targetDate: '2026-11-08',
        priority: 'high',
        progressPercent: 75,
        notes: 'False reject rate reduced to under 0.3% in test dataset.',
        subPoints: [
          { id: 'sub-scp-2-1', title: 'Dual LED ring illumination lighting sign-off', status: 'completed', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-05' },
          { id: 'sub-scp-2-2', title: 'Synthetic training set of 2,000 seal images', status: 'in-progress', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-25' }
        ]
      },

      // 4. OPERATIONAL: FIXTURES
      {
        id: 'pt-fix-1',
        category: 'Fixtures',
        title: 'Main Hydraulic Manifold Clamping Fixture',
        description: 'Custom CNC-machined aluminum fixture with dual pneumatic toggle locks.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-3', // Alex Murphy
        targetDate: '2026-10-28',
        priority: 'critical',
        progressPercent: 80,
        budget: 28000,
        costActual: 24500,
        notes: 'CMM inspection report passed; anodizing finish underway.',
        subPoints: [
          { id: 'sub-fix-1-1', title: 'CNC 5-axis machining of locating nest', status: 'completed', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-02' },
          { id: 'sub-fix-1-2', title: 'Toggle clamp ergonomic safety review', status: 'completed', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-10' },
          { id: 'sub-fix-1-3', title: 'Repeatability GR&R gauge study (target < 10%)', status: 'in-progress', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-26' }
        ]
      },
      {
        id: 'pt-fix-2',
        category: 'Fixtures',
        title: 'Quick-Change Pallet Carrier Jigs',
        description: 'Modular interchangeable nests for 3 drill rig chassis variants.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-2', // Sarah Connor
        targetDate: '2026-11-12',
        priority: 'medium',
        progressPercent: 65,
        budget: 18500,
        costActual: 16200,
        notes: 'Variant A & B fabricated; Variant C in hardening heat treatment.',
        subPoints: [
          { id: 'sub-fix-2-1', title: 'Hardened dowel locating pins fitting', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-06' },
          { id: 'sub-fix-2-2', title: 'RFID tag embedding for automatic program selection', status: 'in-progress', assignedToEmployeeId: 'emp-4', dueDate: '2026-10-31' }
        ]
      },

      // 5. OPERATIONAL: BOMS
      {
        id: 'pt-bom-1',
        category: 'BOMs',
        title: 'BOM Level-1 Structural Architecture Release',
        description: 'Full multi-level engineering BOM frozen in PLM and synced with SAP.',
        status: 'completed',
        assignedToEmployeeId: 'emp-2', // Sarah Connor
        targetDate: '2026-10-01',
        priority: 'high',
        progressPercent: 100,
        notes: 'Zero orphan item numbers; 100% drawings linked to SAP material masters.',
        subPoints: [
          { id: 'sub-bom-1-1', title: 'CAD assembly model freeze and revision B release', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-09-25' },
          { id: 'sub-bom-1-2', title: 'Material master lead times and minimum batch sync', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-09-30' }
        ]
      },
      {
        id: 'pt-bom-2',
        category: 'BOMs',
        title: 'Long-Lead Sourced Sensors & Proportional Valves',
        description: 'High-pressure proportional flow valves procurement and dual-sourcing.',
        status: 'at-risk',
        assignedToEmployeeId: 'emp-4', // Ellen Ripley
        targetDate: '2026-10-24',
        priority: 'critical',
        progressPercent: 55,
        budget: 42000,
        costActual: 45000,
        notes: 'Tier 1 European supplier quoted 4-week transit delay; alternate distributor engaged.',
        subPoints: [
          { id: 'sub-bom-2-1', title: 'Expedited air freight PO for first 15 units', status: 'in-progress', assignedToEmployeeId: 'emp-4', dueDate: '2026-10-18' },
          { id: 'sub-bom-2-2', title: 'Alternate valve DIN-connector compatibility bench test', status: 'in-progress', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-22' }
        ]
      },

      // 6. OPERATIONAL: RESOURCES
      {
        id: 'pt-res-1',
        category: 'Resources',
        title: 'Multi-Skilled Assembly Cell Operators Roster',
        description: 'Allocation of trained Grade-4 mechanical and electrical technicians.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-1', // John Doe
        targetDate: '2026-11-01',
        priority: 'high',
        progressPercent: 85,
        notes: 'Shift A & Shift B key operators cross-trained on hydraulic torquing.',
        subPoints: [
          { id: 'sub-res-1-1', title: 'Allocate 2 certified assemblers per shift', status: 'completed', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-05' },
          { id: 'sub-res-1-2', title: 'Ergonomic rotation schedule mapped in Hours Planner', status: 'completed', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-12' }
        ]
      },
      {
        id: 'pt-res-2',
        category: 'Resources',
        title: 'Dedicated Tooling & Maintenance Specialist',
        description: '24/7 on-call technical support during pre-production commissioning.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-3', // Alex Murphy
        targetDate: '2026-11-15',
        priority: 'medium',
        progressPercent: 70,
        notes: 'Alex Murphy assigned as primary tooling lead with dedicated mobile cart.',
        subPoints: [
          { id: 'sub-res-2-1', title: 'Spare parts kit (O-rings, sensors, fuses) stocked', status: 'completed', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-10' },
          { id: 'sub-res-2-2', title: 'First-response pager & digital huddle alert protocol', status: 'in-progress', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-28' }
        ]
      },

      // 7. OPERATIONAL: KNOWLEDGE TRANSFER
      {
        id: 'pt-kt-1',
        category: 'Knowledge Transfer',
        title: 'One Point Lessons (OPLs) for Fixture Changeover',
        description: 'Visual 1-minute job aids placed directly at workstations.',
        status: 'in-progress',
        assignedToEmployeeId: 'emp-2', // Sarah Connor
        targetDate: '2026-10-31',
        priority: 'medium',
        progressPercent: 70,
        notes: '3 of 5 OPL cards drafted with high-res photos and torque specs.',
        subPoints: [
          { id: 'sub-kt-1-1', title: 'OPL-01: Rapid Nest Clamping Release & Alignment', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-04' },
          { id: 'sub-kt-1-2', title: 'OPL-02: Sensor Mirror Lens Cleaning & Air Blow', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-09' },
          { id: 'sub-kt-1-3', title: 'OPL-03: Barcode Scanner Calibration & Reset', status: 'in-progress', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-25' }
        ]
      },
      {
        id: 'pt-kt-2',
        category: 'Knowledge Transfer',
        title: 'Maintenance Hands-on Fault Diagnostics Training',
        description: '4-hour workshop covering PLC diagnostics, alarm codes, and recovery.',
        status: 'not-started',
        assignedToEmployeeId: 'emp-3', // Alex Murphy
        targetDate: '2026-11-25',
        priority: 'high',
        progressPercent: 20,
        notes: 'Curriculum structured; scheduled for final line commissioning week.',
        subPoints: [
          { id: 'sub-kt-2-1', title: 'Alarm manual laminated cheat-sheet handbook', status: 'in-progress', assignedToEmployeeId: 'emp-3', dueDate: '2026-11-05' },
          { id: 'sub-kt-2-2', title: 'Live simulated fault injection drill for 4 technicians', status: 'not-started', assignedToEmployeeId: 'emp-3', dueDate: '2026-11-20' }
        ]
      },

      // 8. OPERATIONAL: PROTOTYPE SCHEDULE (PRE-PRODUCTIONS)
      {
        id: 'pt-proto-1',
        category: 'Prototype Schedule (Pre-productions)',
        title: 'Prototype Build Round 1 (Offline Rig Validation)',
        description: 'First physical assembly of full drill head on automated pallet fixture.',
        status: 'completed',
        assignedToEmployeeId: 'emp-4', // Ellen Ripley
        targetDate: '2026-10-04',
        priority: 'critical',
        progressPercent: 100,
        notes: 'Completed successfully! Fitment confirmed, 3 routing improvements identified.',
        subPoints: [
          { id: 'sub-prt-1-1', title: 'Harness wire routing length verification', status: 'completed', assignedToEmployeeId: 'emp-4', dueDate: '2026-10-02' },
          { id: 'sub-prt-1-2', title: 'Hydraulic hose bend radius compliance check', status: 'completed', assignedToEmployeeId: 'emp-4', dueDate: '2026-10-04' }
        ]
      },
      {
        id: 'pt-proto-2',
        category: 'Prototype Schedule (Pre-productions)',
        title: 'Pre-Production Pilot Run (10 Units Live Shift Run)',
        description: 'Production speed test with real shift operators and live logging.',
        status: 'in-progress',
        assignedToEmployeeId: 'emp-1', // John Doe
        targetDate: '2026-11-18',
        priority: 'critical',
        progressPercent: 45,
        notes: 'Material kitted for 10 units; pilot date locked for November 18.',
        subPoints: [
          { id: 'sub-prt-2-1', title: 'Kit 10 sets of inspected components in line supermarket', status: 'completed', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-12' },
          { id: 'sub-prt-2-2', title: 'Stopwatch time study across Stations 1 through 4', status: 'not-started', assignedToEmployeeId: 'emp-1', dueDate: '2026-11-18' },
          { id: 'sub-prt-2-3', title: 'Tear-down quality audit on Unit #1 and Unit #10', status: 'not-started', assignedToEmployeeId: 'emp-2', dueDate: '2026-11-20' }
        ]
      },

      // 9. OPERATIONAL: SOPS BREAKDOWNS
      {
        id: 'pt-sop-1',
        category: 'SOPs Breakdowns',
        title: 'SOP-EPS-301: Pallet Loading & Part Clamping Procedure',
        description: 'Standard work combination sheet with photos and safety warning points.',
        status: 'completed',
        assignedToEmployeeId: 'emp-2', // Sarah Connor
        targetDate: '2026-10-08',
        priority: 'high',
        progressPercent: 100,
        notes: 'Signed off by EHS officer and posted on Station 1 digital monitor.',
        subPoints: [
          { id: 'sub-sop-1-1', title: 'Photo capture of correct vs incorrect nest seating', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-04' },
          { id: 'sub-sop-1-2', title: 'EHS ergonomics & pinch-point warning validation', status: 'completed', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-07' }
        ]
      },
      {
        id: 'pt-sop-2',
        category: 'SOPs Breakdowns',
        title: 'SOP-EPS-304: Emergency E-Stop Clearing & Safe Recovery',
        description: 'Step-by-step procedure to reset robot axes without losing homing position.',
        status: 'in-progress',
        assignedToEmployeeId: 'emp-3', // Alex Murphy
        targetDate: '2026-10-29',
        priority: 'critical',
        progressPercent: 65,
        notes: 'Draft complete; undergoing peer review with maintenance supervisor.',
        subPoints: [
          { id: 'sub-sop-2-1', title: 'Safety interlocking recovery flow diagram', status: 'completed', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-11' },
          { id: 'sub-sop-2-2', title: 'Maintenance Lead & Plant Manager approval signoff', status: 'in-progress', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-28' }
        ]
      },

      // 10. CHALLENGES & RISKS
      {
        id: 'pt-chg-1',
        category: 'Challenges',
        title: 'Hydraulic Supply Pressure Fluctuation at Station 2',
        description: 'Observed 12 bar pressure drop during rapid clamp cylinder actuation.',
        status: 'at-risk',
        assignedToEmployeeId: 'emp-4', // Ellen Ripley
        targetDate: '2026-10-20',
        priority: 'critical',
        progressPercent: 50,
        notes: 'Root cause: Shared header line starvation. Mitigation: Adding dedicated 5L accumulator.',
        subPoints: [
          { id: 'sub-chg-1-1', title: 'Install local 5-liter bladder accumulator', status: 'in-progress', assignedToEmployeeId: 'emp-4', dueDate: '2026-10-18' },
          { id: 'sub-chg-1-2', title: 'Digital pressure transducer continuous datalogging', status: 'not-started', assignedToEmployeeId: 'emp-3', dueDate: '2026-10-20' }
        ]
      },
      {
        id: 'pt-chg-2',
        category: 'Challenges',
        title: 'Precision Linear Guide Rail Delivery Lead Time',
        description: 'Vendor notification of customs transit delay for replacement spare rails.',
        status: 'on-track',
        assignedToEmployeeId: 'emp-1', // John Doe
        targetDate: '2026-10-26',
        priority: 'high',
        progressPercent: 80,
        notes: 'Regional distributor located 2 identical units in warehouse; PO transferred.',
        subPoints: [
          { id: 'sub-chg-2-1', title: 'Expedited domestic road freight booking', status: 'completed', assignedToEmployeeId: 'emp-1', dueDate: '2026-10-11' },
          { id: 'sub-chg-2-2', title: 'Receiving dimensional CMM check on arrival', status: 'in-progress', assignedToEmployeeId: 'emp-2', dueDate: '2026-10-24' }
        ]
      }
    ]
  }
];

export const INITIAL_STATE: AppState = {
  currentTeam: 'Assembly Operations',
  currentUserRole: 'Team Lead',
  widgets: INITIAL_WIDGETS,
  deviations: INITIAL_DEVIATIONS,
  actionItems: INITIAL_ACTION_ITEMS,
  safetyCross: INITIAL_SAFETY_CROSS,
  safetyNotes: INITIAL_SAFETY_NOTES,
  employees: INITIAL_EMPLOYEES,
  timeBookings: INITIAL_TIME_BOOKINGS,
  projectMatrices: INITIAL_PROJECT_MATRICES,
  activeProjectId: 'prj-1',
  history: {
    '2026-10-01': {
      widgets: INITIAL_WIDGETS.map(w => w.id === 'd-safety-lti' ? { ...w, value: 139 } : w),
      deviations: [],
      actionItems: [],
      safetyCross: { ...INITIAL_SAFETY_CROSS, 30: 'green' },
      safetyNotes: { ...INITIAL_SAFETY_NOTES, 30: 'No accidents logged today. Perfect shift compliance!' },
      employees: INITIAL_EMPLOYEES,
      timeBookings: INITIAL_TIME_BOOKINGS
    },
    '2026-10-02': {
      widgets: INITIAL_WIDGETS.map(w => w.id === 'd-sust-energy' ? { ...w, actual: 435, state: 'red' } : w),
      deviations: [INITIAL_DEVIATIONS[1]],
      actionItems: [INITIAL_ACTION_ITEMS[2]],
      safetyCross: INITIAL_SAFETY_CROSS,
      safetyNotes: INITIAL_SAFETY_NOTES,
      employees: INITIAL_EMPLOYEES,
      timeBookings: INITIAL_TIME_BOOKINGS
    },
    '2026-10-03': {
      widgets: INITIAL_WIDGETS.map(w => w.id === 'd-safety-hazards' ? { ...w, actual: 1, state: 'red' } : w),
      deviations: [INITIAL_DEVIATIONS[0]],
      actionItems: [INITIAL_ACTION_ITEMS[0]],
      safetyCross: { ...INITIAL_SAFETY_CROSS, 29: 'amber' },
      safetyNotes: { ...INITIAL_SAFETY_NOTES, 29: 'Near-miss: Operator reported slick floor near hydraulic loop.' },
      employees: INITIAL_EMPLOYEES,
      timeBookings: INITIAL_TIME_BOOKINGS
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
