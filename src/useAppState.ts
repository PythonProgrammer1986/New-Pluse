import { useState, useEffect } from 'react';
import { 
  AppState, MetricWidget, Deviation, ActionItem, Pillar, PulseLevel, 
  ProjectTrackRecord, MatrixPoint, MatrixSubPoint, MatrixItemStatus 
} from './types';
import { INITIAL_STATE, INITIAL_PROJECT_MATRICES } from './seedData';

const LOCAL_STORAGE_KEY = 'daily_pulse_huddleboards_state_v1';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Automated Self-Healing: Deduplicate any legacy duplicate keys in deviations
          if (Array.isArray(parsed.deviations)) {
            const seen = new Set();
            parsed.deviations = parsed.deviations.filter((d: any) => {
              if (!d || !d.id || seen.has(d.id)) {
                return false;
              }
              seen.add(d.id);
              return true;
            });
          }
          // Deduplicate any legacy widgets duplicates and filter out preset weekly/monthly widgets
          if (Array.isArray(parsed.widgets)) {
            const seen = new Set();
            parsed.widgets = parsed.widgets.filter((w: any) => {
              if (!w || !w.id || seen.has(w.id)) {
                return false;
              }
              // If it's a weekly or monthly widget, only allow custom created ones
              if ((w.level === 'weekly' || w.level === 'monthly') && !w.id.includes('custom-')) {
                return false;
              }
              seen.add(w.id);
              return true;
            });
          }
          // Deduplicate any legacy action item duplicates
          if (Array.isArray(parsed.actionItems)) {
            const seen = new Set();
            parsed.actionItems = parsed.actionItems.filter((a: any) => {
              if (!a || !a.id || seen.has(a.id)) {
                return false;
              }
              seen.add(a.id);
              return true;
            });
          }
          // Ensure projectMatrices are populated if missing in legacy localStorage
          if (!parsed.projectMatrices || !Array.isArray(parsed.projectMatrices) || parsed.projectMatrices.length === 0) {
            parsed.projectMatrices = INITIAL_PROJECT_MATRICES;
            parsed.activeProjectId = 'prj-1';
          }
          if (!parsed.activeProjectId && parsed.projectMatrices.length > 0) {
            parsed.activeProjectId = parsed.projectMatrices[0].id;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return INITIAL_STATE;
  });

  // Save to local storage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [state]);

  const setTeam = (teamName: string) => {
    setState((prev) => ({ ...prev, currentTeam: teamName }));
  };

  const setRole = (roleName: string) => {
    setState((prev) => ({ ...prev, currentUserRole: roleName }));
  };

  const updateWidgetValue = (id: string, updates: Partial<MetricWidget>) => {
    setState((prev) => {
      let updatedWidgets = prev.widgets.map((w): MetricWidget => {
        if (w.id === id) {
          const nextWidget: MetricWidget = { ...w, ...updates };
          
          // Automatic state check if actual & target are numeric
          if (updates.actual !== undefined && nextWidget.target !== undefined) {
            const actual = updates.actual;
            const target = nextWidget.target;
            
            // For standard operational metrics:
            // - If Safety hazards: actual should be <= target (0)
            // - If Cost/Downtime: actual should be <= target
            // - If Throughput/OTIF/OEE/ROI/Diversion: actual should be >= target
            let isGreen = true;
            if (nextWidget.pillar === 'Safety' && nextWidget.type === 'numeric') {
              isGreen = actual <= target;
            } else if (nextWidget.pillar === 'Quality' && nextWidget.type === 'numeric') {
              isGreen = actual <= target;
            } else if (nextWidget.id.includes('downtime') || nextWidget.id.includes('overtime') || nextWidget.id.includes('scrap')) {
              isGreen = actual <= target;
            } else {
              isGreen = actual >= target;
            }
            nextWidget.state = isGreen ? 'green' : 'red';
          }
          return nextWidget;
        }
        return w;
      });

      let nextProjectMatrices = prev.projectMatrices || [];
      const updatedWidget = updatedWidgets.find(w => w.id === id);
      if (updatedWidget && updatedWidget.projectId && updates.title !== undefined) {
        nextProjectMatrices = nextProjectMatrices.map(p => p.id === updatedWidget.projectId ? { ...p, name: updates.title! } : p);
      }

      // Synchronize linked widgets (two-way alignment)
      const sourceWidget = updatedWidgets.find(w => w.id === id);
      if (sourceWidget) {
        for (let i = 0; i < updatedWidgets.length; i++) {
          const w = updatedWidgets[i];
          if (w.linkedWidgetId === id) {
            updatedWidgets[i] = {
              ...w,
              actual: sourceWidget.actual !== undefined ? sourceWidget.actual : w.actual,
              target: sourceWidget.target !== undefined ? sourceWidget.target : w.target,
              value: sourceWidget.value !== undefined ? sourceWidget.value : w.value,
              state: sourceWidget.state,
              checklist: sourceWidget.checklist ? [...sourceWidget.checklist] : w.checklist,
              dataPoints: sourceWidget.dataPoints ? [...sourceWidget.dataPoints] : w.dataPoints,
              milestones: sourceWidget.milestones ? [...sourceWidget.milestones] : w.milestones,
            };
          } else if (id === w.id && w.linkedWidgetId) {
            const parentWidget = updatedWidgets.find(p => p.id === w.linkedWidgetId);
            if (parentWidget) {
              const parentIdx = updatedWidgets.findIndex(p => p.id === w.linkedWidgetId);
              if (parentIdx !== -1) {
                updatedWidgets[parentIdx] = {
                  ...parentWidget,
                  actual: w.actual !== undefined ? w.actual : parentWidget.actual,
                  target: w.target !== undefined ? w.target : parentWidget.target,
                  value: w.value !== undefined ? w.value : parentWidget.value,
                  state: w.state,
                  checklist: w.checklist ? [...w.checklist] : parentWidget.checklist,
                  dataPoints: w.dataPoints ? [...w.dataPoints] : parentWidget.dataPoints,
                  milestones: w.milestones ? [...w.milestones] : parentWidget.milestones,
                };
              }
            }
          }
        }
      }

      // Automated check: if a widget changed to 'red', let's auto-suggest a deviation
      // if one doesn't exist for today.
      const changedWidget = updatedWidgets.find((w) => w.id === id);
      let nextDeviations = [...prev.deviations];
      let nextActionItems = [...prev.actionItems];
      
      if (changedWidget && changedWidget.state === 'red') {
        const hasExisting = prev.deviations.some(
          (d) => d.widgetId === id && !d.isResolved
        );
        if (!hasExisting) {
          const devId = generateId('dev');
          const newDev: Deviation = {
            id: devId,
            widgetId: changedWidget.id,
            widgetTitle: changedWidget.title,
            pillar: changedWidget.pillar,
            level: changedWidget.level,
            date: new Date().toISOString().split('T')[0],
            description: `Deviation flagged: ${changedWidget.title} is performing outside target thresholds (${changedWidget.actual ?? ''} vs target ${changedWidget.target ?? ''}).`,
            fiveWhys: [
              'Why did the deviation occur? (Level 1 Root Cause)',
              'Why? (Level 2 Root Cause)',
              'Why? (Level 3 Root Cause)',
              'Why? (Level 4 Root Cause)',
              'Why? (Root cause driver established)'
            ],
            rootCause: 'Root cause analysis in progress...',
            isResolved: false
          };
          nextDeviations = [newDev, ...nextDeviations];

          // Auto-Drafted Countermeasure Action Item
          const autoAction: ActionItem = {
            id: generateId('act'),
            pillar: changedWidget.pillar,
            title: `INVESTIGATE: Audit operational logs and perform emergency SOP review for "${changedWidget.title}"`,
            owner: 'Shift Supervisor',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
            priority: 'high',
            status: 'open',
            notes: `Auto-generated countermeasure linked to deviation ${devId}.`,
            deviationId: devId
          };
          nextActionItems = [autoAction, ...nextActionItems];
        }
      }

      return {
        ...prev,
        widgets: updatedWidgets,
        projectMatrices: nextProjectMatrices,
        deviations: nextDeviations,
        actionItems: nextActionItems
      };
    });
  };

  const toggleChecklistItem = (widgetId: string, itemId: string) => {
    setState((prev) => {
      const updatedWidgets = prev.widgets.map((w): MetricWidget => {
        if (w.id === widgetId && w.checklist) {
          const nextChecklist = w.checklist.map((item) => {
            if (item.id === itemId) {
              return { ...item, checked: !item.checked };
            }
            return item;
          });
          
          // If all items are checked, state is green, else red
          const allChecked = nextChecklist.every((item) => item.checked);
          return {
            ...w,
            checklist: nextChecklist,
            state: allChecked ? 'green' : 'red'
          };
        }
        return w;
      });

      return {
        ...prev,
        widgets: updatedWidgets
      };
    });
  };

  const updateSafetyCross = (dayIndex: number, status: 'green' | 'red' | 'amber' | 'none') => {
    setState((prev) => ({
      ...prev,
      safetyCross: {
        ...prev.safetyCross,
        [dayIndex]: status
      }
    }));
  };

  const addWidget = (newWidget: Omit<MetricWidget, 'id' | 'state'>) => {
    setState((prev) => {
      const widget: MetricWidget = {
        ...newWidget,
        id: generateId('custom'),
        state: 'green'
      };
      return {
        ...prev,
        widgets: [...prev.widgets, widget]
      };
    });
  };

  const deleteWidget = (id: string) => {
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id)
    }));
  };

  const addDeviation = (deviation: Omit<Deviation, 'id' | 'isResolved'>) => {
    setState((prev) => {
      const newDev: Deviation = {
        ...deviation,
        id: generateId('dev'),
        isResolved: false
      };
      return {
        ...prev,
        deviations: [newDev, ...prev.deviations]
      };
    });
  };

  const updateDeviation = (id: string, updates: Partial<Deviation>) => {
    setState((prev) => ({
      ...prev,
      deviations: prev.deviations.map((d) => {
        if (d.id === id) {
          const updated = { ...d, ...updates };
          // If a deviation is resolved, check if we should resolve any linked action item or widget
          return updated;
        }
        return d;
      })
    }));
  };

  const deleteDeviation = (id: string) => {
    setState((prev) => ({
      ...prev,
      deviations: prev.deviations.filter((d) => d.id !== id)
    }));
  };

  const addActionItem = (action: Omit<ActionItem, 'id'>) => {
    const newId = generateId('act');
    setState((prev) => {
      const newAction: ActionItem = {
        ...action,
        id: newId
      };
      
      // If linked to a deviation, update the deviation's actionItemId
      let updatedDeviations = [...prev.deviations];
      if (action.deviationId) {
        updatedDeviations = prev.deviations.map((dev) => {
          if (dev.id === action.deviationId) {
            return { ...dev, actionItemId: newId };
          }
          return dev;
        });
      }

      return {
        ...prev,
        actionItems: [newAction, ...prev.actionItems],
        deviations: updatedDeviations
      };
    });
  };

  const updateActionItem = (id: string, updates: Partial<ActionItem>) => {
    setState((prev) => {
      const updatedActions = prev.actionItems.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      });

      // If an action item linked to a deviation is resolved, we can check if we auto-resolve the deviation too!
      let updatedDeviations = [...prev.deviations];
      const targetAction = updatedActions.find((a) => a.id === id);
      if (targetAction && targetAction.status === 'resolved' && targetAction.deviationId) {
        updatedDeviations = prev.deviations.map((dev) => {
          if (dev.id === targetAction.deviationId) {
            return { ...dev, isResolved: true };
          }
          return dev;
        });
      }

      return {
        ...prev,
        actionItems: updatedActions,
        deviations: updatedDeviations
      };
    });
  };

  const deleteActionItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((item) => item.id !== id),
      // Clean up pointer in deviations
      deviations: prev.deviations.map((dev) => {
        if (dev.actionItemId === id) {
          return { ...dev, actionItemId: undefined };
        }
        return dev;
      })
    }));
  };

  const exportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    
    const formattedDate = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `daily_pulse_huddleboards_backup_${formattedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object' && 'widgets' in parsed && 'deviations' in parsed) {
        setState(parsed);
        return true;
      }
    } catch (e) {
      console.error('Error parsing backup JSON file', e);
    }
    return false;
  };

  const updateSafetyNote = (dayIndex: number, note: string) => {
    setState((prev) => ({
      ...prev,
      safetyNotes: {
        ...(prev.safetyNotes || {}),
        [dayIndex]: note
      }
    }));
  };

  const addEmployee = (name: string, monthlyAvailableHours: number) => {
    setState((prev) => {
      const newEmp = {
        id: generateId('emp'),
        name,
        monthlyAvailableHours
      };
      const currentList = prev.employees || [];
      return {
        ...prev,
        employees: [...currentList, newEmp]
      };
    });
  };

  const updateEmployee = (id: string, updates: { name?: string; monthlyAvailableHours?: number }) => {
    setState((prev) => {
      const currentList = prev.employees || [];
      return {
        ...prev,
        employees: currentList.map((emp) => emp.id === id ? { ...emp, ...updates } : emp)
      };
    });
  };

  const deleteEmployee = (id: string) => {
    setState((prev) => {
      const currentList = prev.employees || [];
      const currentBookings = prev.timeBookings || [];
      return {
        ...prev,
        employees: currentList.filter((emp) => emp.id !== id),
        timeBookings: currentBookings.filter((book) => book.employeeId !== id)
      };
    });
  };

  const addTimeBooking = (booking: { employeeId: string; taskTitle: string; plannedHours: number; actualHours: number; date: string }) => {
    setState((prev) => {
      const newBook = {
        ...booking,
        id: generateId('book')
      };
      const currentList = prev.timeBookings || [];
      return {
        ...prev,
        timeBookings: [newBook, ...currentList]
      };
    });
  };

  const updateTimeBooking = (id: string, updates: { employeeId?: string; taskTitle?: string; plannedHours?: number; actualHours?: number; date?: string }) => {
    setState((prev) => {
      const currentList = prev.timeBookings || [];
      return {
        ...prev,
        timeBookings: currentList.map((book) => book.id === id ? { ...book, ...updates } : book)
      };
    });
  };

  const deleteTimeBooking = (id: string) => {
    setState((prev) => {
      const currentList = prev.timeBookings || [];
      return {
        ...prev,
        timeBookings: currentList.filter((book) => book.id !== id)
      };
    });
  };

  const saveSnapshot = (dateString: string) => {
    setState((prev) => {
      const snapshot = {
        widgets: prev.widgets,
        deviations: prev.deviations,
        actionItems: prev.actionItems,
        safetyCross: prev.safetyCross,
        safetyNotes: prev.safetyNotes || {},
        employees: prev.employees || [],
        timeBookings: prev.timeBookings || [],
        projectMatrices: prev.projectMatrices || [],
        activeProjectId: prev.activeProjectId
      };
      return {
        ...prev,
        history: {
          ...(prev.history || {}),
          [dateString]: snapshot
        }
      };
    });
  };

  const restoreSnapshot = (dateString: string) => {
    setState((prev) => {
      if (!prev.history || !prev.history[dateString]) return prev;
      const snapshot = prev.history[dateString];
      return {
        ...prev,
        widgets: snapshot.widgets,
        deviations: snapshot.deviations,
        actionItems: snapshot.actionItems,
        safetyCross: snapshot.safetyCross,
        safetyNotes: snapshot.safetyNotes,
        employees: snapshot.employees || prev.employees || [],
        timeBookings: snapshot.timeBookings || prev.timeBookings || [],
        projectMatrices: snapshot.projectMatrices || prev.projectMatrices || [],
        activeProjectId: snapshot.activeProjectId || prev.activeProjectId || 'prj-1'
      };
    });
  };

  const deleteSnapshot = (dateString: string) => {
    setState((prev) => {
      if (!prev.history) return prev;
      const nextHistory = { ...prev.history };
      delete nextHistory[dateString];
      return {
        ...prev,
        history: nextHistory
      };
    });
  };

  // ================= PROJECT MATRIX METHODS =================
  const setActiveProjectId = (id: string) => {
    setState((prev) => ({ ...prev, activeProjectId: id }));
  };

  const addProjectMatrix = (projectData: { name: string; code: string; description?: string; targetLaunchDate?: string }) => {
    const newId = generateId('prj');
    setState((prev) => {
      const newPrj: ProjectTrackRecord = {
        id: newId,
        name: projectData.name,
        code: projectData.code,
        description: projectData.description,
        targetLaunchDate: projectData.targetLaunchDate,
        overallStatus: 'green',
        lastUpdated: new Date().toISOString().split('T')[0],
        customCategories: [],
        points: []
      };
      const newWidget: MetricWidget = {
        id: generateId('widget'),
        title: projectData.name,
        pillar: 'Cost',
        level: 'daily',
        type: 'projectMatrix',
        state: 'green',
        projectId: newId,
        description: projectData.description || `Project matrix tracking for ${projectData.name} (${projectData.code})`
      };
      return {
        ...prev,
        projectMatrices: [...(prev.projectMatrices || []), newPrj],
        widgets: [...prev.widgets, newWidget],
        activeProjectId: newId
      };
    });
    return newId;
  };

  const updateProjectMatrix = (id: string, updates: Partial<ProjectTrackRecord>) => {
    setState((prev) => {
      const nextProjects = (prev.projectMatrices || []).map((p) =>
        p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : p
      );
      let nextWidgets = prev.widgets;
      if (updates.name !== undefined) {
        nextWidgets = prev.widgets.map((w) => (w.projectId === id ? { ...w, title: updates.name! } : w));
      }
      return {
        ...prev,
        projectMatrices: nextProjects,
        widgets: nextWidgets
      };
    });
  };

  const deleteProjectMatrix = (id: string) => {
    setState((prev) => {
      const remaining = (prev.projectMatrices || []).filter((p) => p.id !== id);
      const nextWidgets = (prev.widgets || []).filter((w) => w.projectId !== id);
      const nextActiveId = remaining.length > 0 ? remaining.length > 0 ? remaining[0].id : undefined : undefined;
      return {
        ...prev,
        projectMatrices: remaining,
        widgets: nextWidgets,
        activeProjectId: prev.activeProjectId === id ? nextActiveId : prev.activeProjectId
      };
    });
  };

  const duplicateProjectMatrix = (id: string) => {
    setState((prev) => {
      const target = (prev.projectMatrices || []).find((p) => p.id === id);
      if (!target) return prev;
      const newId = generateId('prj');
      const cloned: ProjectTrackRecord = {
        ...target,
        id: newId,
        name: `${target.name} (Copy)`,
        code: `${target.code}-CPY`,
        lastUpdated: new Date().toISOString().split('T')[0],
        points: target.points.map((pt) => ({
          ...pt,
          id: generateId('pt'),
          subPoints: pt.subPoints.map((sub) => ({ ...sub, id: generateId('sub') }))
        }))
      };
      return {
        ...prev,
        projectMatrices: [...(prev.projectMatrices || []), cloned],
        activeProjectId: newId
      };
    });
  };

  const addMatrixPoint = (projectId: string, point: Omit<MatrixPoint, 'id' | 'subPoints'> & { subPoints?: MatrixSubPoint[] }) => {
    const newPtId = generateId('pt');
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const newPoint: MatrixPoint = {
            ...point,
            id: newPtId,
            subPoints: point.subPoints || []
          };
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: [...prj.points, newPoint]
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const updateMatrixPoint = (projectId: string, pointId: string, updates: Partial<MatrixPoint>) => {
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const nextPoints = prj.points.map((pt) => {
            if (pt.id === pointId) {
              const merged = { ...pt, ...updates };
              // If status is updated to completed, automatically set progressPercent to 100
              if (updates.status === 'completed' && updates.progressPercent === undefined) {
                merged.progressPercent = 100;
              }
              return merged;
            }
            return pt;
          });
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: nextPoints
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const deleteMatrixPoint = (projectId: string, pointId: string) => {
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: (prj.points || []).filter((pt) => pt.id !== pointId)
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const duplicateMatrixPoint = (projectId: string, pointId: string) => {
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const source = prj.points.find((p) => p.id === pointId);
          if (!source) return prj;
          const cloned: MatrixPoint = {
            ...source,
            id: generateId('pt'),
            title: `${source.title} (Copy)`,
            subPoints: source.subPoints.map((s) => ({ ...s, id: generateId('sub') }))
          };
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: [...prj.points, cloned]
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const addMatrixSubPoint = (projectId: string, pointId: string, subPoint: Omit<MatrixSubPoint, 'id'>) => {
    const newSubId = generateId('sub');
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const nextPoints = prj.points.map((pt) => {
            if (pt.id === pointId) {
              const newSub: MatrixSubPoint = {
                ...subPoint,
                id: newSubId
              };
              const updatedSubPoints = [...pt.subPoints, newSub];
              // Calculate progress % based on sub-points completion
              const completedCount = updatedSubPoints.filter((s) => s.status === 'completed').length;
              const autoProgress = Math.round((completedCount / updatedSubPoints.length) * 100);

              return {
                ...pt,
                subPoints: updatedSubPoints,
                progressPercent: autoProgress
              };
            }
            return pt;
          });
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: nextPoints
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const updateMatrixSubPoint = (projectId: string, pointId: string, subPointId: string, updates: Partial<MatrixSubPoint>) => {
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const nextPoints = (prj.points || []).map((pt) => {
            if (pt.id === pointId) {
              const currentSubs = pt.subPoints || [];
              const nextSubPoints = currentSubs.map((s) => (s.id === subPointId ? { ...s, ...updates } : s));
              const completedCount = nextSubPoints.filter((s) => s.status === 'completed').length;
              const autoProgress = nextSubPoints.length > 0 ? Math.round((completedCount / nextSubPoints.length) * 100) : (pt.progressPercent || 0);
              const isAllDone = nextSubPoints.length > 0 && nextSubPoints.every((s) => s.status === 'completed');

              return {
                ...pt,
                subPoints: nextSubPoints,
                progressPercent: autoProgress,
                status: isAllDone ? 'completed' : pt.status
              };
            }
            return pt;
          });
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: nextPoints
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const deleteMatrixSubPoint = (projectId: string, pointId: string, subPointId: string) => {
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const nextPoints = (prj.points || []).map((pt) => {
            if (pt.id === pointId) {
              const currentSubs = pt.subPoints || [];
              const remaining = currentSubs.filter((s) => s.id !== subPointId);
              const completedCount = remaining.filter((s) => s.status === 'completed').length;
              const autoProgress = remaining.length > 0 ? Math.round((completedCount / remaining.length) * 100) : (pt.progressPercent || 0);
              return {
                ...pt,
                subPoints: remaining,
                progressPercent: autoProgress
              };
            }
            return pt;
          });
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            points: nextPoints
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const addCustomMatrixCategory = (projectId: string, categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const current = prj.customCategories || [];
          if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prj;
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            customCategories: [...current, trimmed]
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const deleteCustomMatrixCategory = (projectId: string, categoryName: string) => {
    const target = categoryName.trim();
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const currentCustom = prj.customCategories || [];
          const currentHidden = prj.hiddenCategories || [];
          return {
            ...prj,
            lastUpdated: new Date().toISOString().split('T')[0],
            customCategories: currentCustom.filter((c) => c.trim().toLowerCase() !== target.toLowerCase()),
            hiddenCategories: [...new Set([...currentHidden, target])],
            points: (prj.points || []).filter((pt) => pt.category?.trim().toLowerCase() !== target.toLowerCase())
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const updateCustomMatrixCategory = (projectId: string, oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) return;
    setState((prev) => {
      const updated = (prev.projectMatrices || []).map((prj) => {
        if (prj.id === projectId) {
          const current = prj.customCategories || [];
          return {
            ...prj,
            customCategories: current.map((c) => c === oldName ? newName.trim() : c),
            points: prj.points.map((pt) => pt.category === oldName ? { ...pt, category: newName.trim() } : pt)
          };
        }
        return prj;
      });
      return { ...prev, projectMatrices: updated };
    });
  };

  const reorderWidgets = (draggedId: string, targetId: string) => {
    setState((prev) => {
      const draggedIdx = prev.widgets.findIndex((w) => w.id === draggedId);
      const targetIdx = prev.widgets.findIndex((w) => w.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prev;

      const updatedWidgets = [...prev.widgets];
      const draggedWidget = { ...updatedWidgets[draggedIdx] };
      const targetWidget = updatedWidgets[targetIdx];

      // Update the pillar of the dragged widget to match the target widget's pillar,
      // so that it physically moves between columns (sidewise)!
      if (draggedWidget.pillar !== targetWidget.pillar) {
        draggedWidget.pillar = targetWidget.pillar;
      }

      updatedWidgets.splice(draggedIdx, 1);
      updatedWidgets.splice(targetIdx, 0, draggedWidget);

      return {
        ...prev,
        widgets: updatedWidgets
      };
    });
  };

  const resetToTemplate = () => {
    setState(INITIAL_STATE);
  };

  return {
    state,
    setTeam,
    setRole,
    updateWidgetValue,
    toggleChecklistItem,
    updateSafetyCross,
    updateSafetyNote,
    addWidget,
    deleteWidget,
    reorderWidgets,
    addDeviation,
    updateDeviation,
    deleteDeviation,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    exportBackup,
    importBackup,
    resetToTemplate,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addTimeBooking,
    updateTimeBooking,
    deleteTimeBooking,
    // Project Matrix methods
    setActiveProjectId,
    addProjectMatrix,
    updateProjectMatrix,
    deleteProjectMatrix,
    duplicateProjectMatrix,
    addMatrixPoint,
    updateMatrixPoint,
    deleteMatrixPoint,
    duplicateMatrixPoint,
    addMatrixSubPoint,
    updateMatrixSubPoint,
    deleteMatrixSubPoint,
    addCustomMatrixCategory,
    deleteCustomMatrixCategory,
    updateCustomMatrixCategory
  };
}
