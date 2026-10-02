import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, FileText, Check } from 'lucide-react';

interface SafetyCrossCalendarProps {
  safetyCross: { [dayIndex: number]: 'green' | 'red' | 'none' };
  safetyNotes?: { [dayIndex: number]: string };
  onDayClick: (dayIndex: number, status: 'green' | 'red' | 'none') => void;
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

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getStatusColor = (status: 'green' | 'red' | 'none', isSelected: boolean) => {
    let classes = '';
    switch (status) {
      case 'green':
        classes = 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white';
        break;
      case 'red':
        classes = 'bg-rose-500 hover:bg-rose-600 border-rose-600 text-white animate-pulse';
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

  const handleStatusChange = (status: 'green' | 'red' | 'none') => {
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

      {/* LTI Counter Widget Integration */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Days Since Last LTI</span>
          <span className="text-3xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {daysSinceLastLTI}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onIncrementLTI}
            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition-colors cursor-pointer"
          >
            +1 Day
          </button>
          <button
            onClick={onResetLTI}
            className="px-2.5 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-colors cursor-pointer"
          >
            Reset (0)
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Select a day on the calendar grid to toggle its safe/alert status and enter daily safety huddle notes.
      </p>

      {/* Safety Cross Visual Pattern */}
      <div className="grid grid-cols-7 gap-1.5">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
        {/* Placeholder cells for alignment (Day 1 Wednesday) */}
        <div className="aspect-square border border-transparent rounded-md"></div>
        <div className="aspect-square border border-transparent rounded-md"></div>
        
        {days.map((day) => {
          const status = safetyCross[day] || 'none';
          const hasNote = !!safetyNotes[day];
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => handleSelectDay(day)}
              className={`aspect-square relative flex flex-col items-center justify-center text-xs font-mono font-bold rounded-md border transition-all shadow-sm cursor-pointer ${getStatusColor(status, isSelected)}`}
              title={`Day ${day}: Select to view notes/edit status`}
            >
              <span>{day}</span>
              {/* Note indicator dot */}
              {hasNote && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                  status === 'none' ? 'bg-indigo-500' : 'bg-white'
                }`}></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Note Taking and Status Panel */}
      {selectedDay !== null && (
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Day {selectedDay} Log & Notes
            </span>
            <div className="flex items-center gap-1">
              {(['green', 'red', 'none'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    (safetyCross[selectedDay] || 'none') === s
                      ? s === 'green' ? 'bg-emerald-500 text-white' : s === 'red' ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
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
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
            />
            <div className="flex justify-end">
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
      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
          <span>Safe Shift</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-rose-500 animate-pulse"></div>
          <span>Deviation</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></div>
          <span>No Log</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-1.5 h-1.5 rounded bg-slate-400"></div>
          <span>Has Notes</span>
        </div>
      </div>
    </div>
  );
}
