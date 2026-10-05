import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, FileText, Check } from 'lucide-react';

interface SafetyCrossCalendarProps {
  safetyCross: { [dayIndex: number]: 'green' | 'red' | 'amber' | 'none' };
  safetyNotes?: { [dayIndex: number]: string };
  onDayClick: (dayIndex: number, status: 'green' | 'red' | 'amber' | 'none') => void;
  onUpdateNote: (dayIndex: number, note: string) => void;
  daysSinceLastLTI: number;
  onResetLTI: () => void;
  onIncrementLTI: () => void;
}

export default function SafetyCrossCalendar({
  safetyCross,
  safetyNotes = {},
  onDayClick,
  onUpdateNote,
  daysSinceLastLTI,
  onResetLTI,
  onIncrementLTI,
}: SafetyCrossCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [noteText, setNoteNoteText] = useState(safetyNotes[new Date().getDate()] || '');

  // State to track hover tooltip day
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getStatusColor = (status: 'green' | 'red' | 'amber' | 'none', isSelected: boolean) => {
    let classes = '';
    switch (status) {
      case 'green':
        classes = 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white';
        break;
      case 'red':
        classes = 'bg-rose-500 hover:bg-rose-600 border-rose-600 text-white animate-pulse';
        break;
      case 'amber':
        classes = 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-slate-950 font-bold';
        break;
      default:
        classes = 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300';
    }
    if (isSelected) {
      classes += ' ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105';
    }
    return classes;
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setNoteNoteText(safetyNotes[day] || '');
  };

  const handleStatusChange = (status: 'green' | 'red' | 'amber' | 'none') => {
    if (selectedDay !== null) {
      onDayClick(selectedDay, status);
    }
  };

  const handleSaveNote = () => {
    if (selectedDay !== null) {
      onUpdateNote(selectedDay, noteText);
    }
  };

  // Summarize count
  const redDays = Object.values(safetyCross).filter(s => s === 'red').length;
  const greenDays = Object.values(safetyCross).filter(s => s === 'green').length;
  const amberDays = Object.values(safetyCross).filter(s => s === 'amber').length;

  const getGreenStreak = () => {
    let maxStreak = 0;
    let currStreak = 0;
    for (let d = 1; d <= 31; d++) {
      if (safetyCross[d] === 'green') {
        currStreak++;
        if (currStreak > maxStreak) {
          maxStreak = currStreak;
        }
      } else {
        currStreak = 0;
      }
    }
    return maxStreak;
  };

  const totalLogged = greenDays + redDays + amberDays;
  const complianceRate = totalLogged > 0 ? Math.round((greenDays / totalLogged) * 100) : 100;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Interactive Safety Cross</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Green: {greenDays}</span>
          <span>·</span>
          <span className="text-rose-600">Red: {redDays}</span>
        </div>
      </div>

      {/* LTI Counter Widget Integration & SAFETY ANALYTICS PANEL */}
      <div className="space-y-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 block font-bold uppercase tracking-wider">Days Since Last LTI</span>
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {daysSinceLastLTI}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={onIncrementLTI}
              className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-150 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              +1 Day
            </button>
            <button
              onClick={onResetLTI}
              className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-150 rounded hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Reset (0)
            </button>
          </div>
        </div>

        {/* Live Safety Analytics */}
        <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 rounded-lg text-center">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Compliance</span>
            <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">{complianceRate}%</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Streak</span>
            <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">{getGreenStreak()} d</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Incidents</span>
            <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-450">{redDays}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Near-Miss</span>
            <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-500">{amberDays}</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Select a day to log safety logs or hover to view shift observations instantly.
      </p>

      {/* Safety Cross Visual Pattern with Weekly Compliance Heatmap Outlines */}
      <div className="space-y-2.5 relative">
        {/* Floating Hover Tooltip Card */}
        {hoveredDay !== null && (
          <div className="absolute z-50 bg-slate-950 text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-slate-700 w-48 pointer-events-none animate-fade-in font-sans"
               style={{ top: '35%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 font-bold">
              <span>Day {hoveredDay} Log</span>
              <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-black ${
                (safetyCross[hoveredDay] || 'none') === 'green' ? 'bg-emerald-500 text-white' :
                (safetyCross[hoveredDay] || 'none') === 'red' ? 'bg-rose-500 text-white animate-pulse' :
                (safetyCross[hoveredDay] || 'none') === 'amber' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {safetyCross[hoveredDay] || 'No Log'}
              </span>
            </div>
            <p className="italic text-slate-300 leading-normal font-medium">
              {safetyNotes[hoveredDay] || 'No safety notes logged for this shift.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* 5 Bounded Weekly Compliance Rows */}
        <div className="space-y-1.5">
          {[
            {
              label: 'W1',
              days: [
                { type: 'placeholder' },
                { type: 'placeholder' },
                { type: 'day', val: 1 },
                { type: 'day', val: 2 },
                { type: 'day', val: 3 },
                { type: 'day', val: 4 },
                { type: 'day', val: 5 }
              ]
            },
            {
              label: 'W2',
              days: [
                { type: 'day', val: 6 },
                { type: 'day', val: 7 },
                { type: 'day', val: 8 },
                { type: 'day', val: 9 },
                { type: 'day', val: 10 },
                { type: 'day', val: 11 },
                { type: 'day', val: 12 }
              ]
            },
            {
              label: 'W3',
              days: [
                { type: 'day', val: 13 },
                { type: 'day', val: 14 },
                { type: 'day', val: 15 },
                { type: 'day', val: 16 },
                { type: 'day', val: 17 },
                { type: 'day', val: 18 },
                { type: 'day', val: 19 }
              ]
            },
            {
              label: 'W4',
              days: [
                { type: 'day', val: 20 },
                { type: 'day', val: 21 },
                { type: 'day', val: 22 },
                { type: 'day', val: 23 },
                { type: 'day', val: 24 },
                { type: 'day', val: 25 },
                { type: 'day', val: 26 }
              ]
            },
            {
              label: 'W5',
              days: [
                { type: 'day', val: 27 },
                { type: 'day', val: 28 },
                { type: 'day', val: 29 },
                { type: 'day', val: 30 },
                { type: 'day', val: 31 },
                { type: 'placeholder' },
                { type: 'placeholder' }
              ]
            }
          ].map((week, wIdx) => {
            const activeVals = week.days.filter(d => d.type === 'day').map(d => d.val!);
            const weekStatuses = activeVals.map(v => safetyCross[v] || 'none');
            const hasRed = weekStatuses.includes('red');
            const hasAmber = weekStatuses.includes('amber');
            const hasGreen = weekStatuses.includes('green');
            
            let outlineClass = 'border border-slate-100 dark:border-slate-800 bg-transparent';
            let statusText = 'Pending';
            if (hasRed) {
              outlineClass = 'border border-rose-300 dark:border-rose-950/60 bg-rose-50/5';
              statusText = 'Incident';
            } else if (hasAmber) {
              outlineClass = 'border border-amber-300 dark:border-amber-950/60 bg-amber-50/5';
              statusText = 'Near-Miss';
            } else if (hasGreen) {
              outlineClass = 'border border-emerald-300 dark:border-emerald-950/60 bg-emerald-50/5';
              statusText = 'Perfect';
            }

            return (
              <div 
                key={wIdx} 
                className={`p-1 rounded-lg transition-all flex items-center gap-1.5 ${outlineClass}`}
                title={`Week ${wIdx + 1} Status: ${statusText}`}
              >
                {/* Micro Week compliance label */}
                <span className={`text-[8px] font-black font-mono w-4 text-center select-none uppercase truncate ${
                  hasRed ? 'text-rose-500' : hasAmber ? 'text-amber-500' : hasGreen ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  {week.label}
                </span>

                <div className="grid grid-cols-7 gap-1.5 flex-1">
                  {week.days.map((item, dIdx) => {
                    if (item.type === 'placeholder') {
                      return <div key={dIdx} className="aspect-square border border-transparent rounded-md"></div>;
                    }
                    const dayVal = item.val!;
                    const status = safetyCross[dayVal] || 'none';
                    const hasNote = !!safetyNotes[dayVal];
                    const isSelected = selectedDay === dayVal;
                    return (
                      <button
                        key={dIdx}
                        onClick={() => handleSelectDay(dayVal)}
                        onMouseEnter={() => setHoveredDay(dayVal)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`aspect-square relative flex flex-col items-center justify-center text-xs font-mono font-bold rounded-md border transition-all shadow-sm cursor-pointer ${getStatusColor(status, isSelected)}`}
                      >
                        <span>{dayVal}</span>
                        {/* Note indicator dot */}
                        {hasNote && (
                          <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                            status === 'none' ? 'bg-indigo-500' : status === 'amber' ? 'bg-slate-950' : 'bg-white'
                          }`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Note Taking and Status Panel */}
      {selectedDay !== null && (
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Day {selectedDay} Log & Notes
            </span>
            <div className="flex items-center gap-1">
              {(['green', 'red', 'amber', 'none'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    (safetyCross[selectedDay] || 'none') === s
                      ? s === 'green' ? 'bg-emerald-500 text-white' : s === 'red' ? 'bg-rose-500 text-white animate-pulse' : s === 'amber' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-350 text-slate-800'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {s === 'none' ? 'clear' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteNoteText(e.target.value)}
              onBlur={handleSaveNote}
              placeholder="Add safety notes, incident descriptions, or audit observations for this shift..."
              rows={2}
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner font-semibold"
            />
            
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                <Check className="w-3 h-3" /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
          <span>Safe</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
          <span>Near-Miss</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse"></div>
          <span>Incident</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></div>
          <span>No Log</span>
        </div>
      </div>
    </div>
  );
}
