import React, { useState, useEffect } from 'react';
import { Shield, FileText, Check } from 'lucide-react';
import VoiceInputButton from './VoiceInputButton';

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
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [noteText, setNoteText] = useState(safetyNotes[new Date().getDate()] || '');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);

  // Sync note editor whenever selected day or external safetyNotes (e.g. AI Scribe / Snapshot) change
  useEffect(() => {
    setNoteText(safetyNotes[selectedDay] || '');
  }, [selectedDay, safetyNotes]);

  const getStatusColor = (status: 'green' | 'red' | 'amber' | 'none', isSelected: boolean) => {
    let classes = '';
    switch (status) {
      case 'green':
        classes = 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white';
        break;
      case 'red':
        classes = 'bg-rose-500 hover:bg-rose-600 border-rose-600 text-white';
        break;
      case 'amber':
        classes = 'bg-[#FFC20E] hover:bg-[#E5AE00] border-[#D9A300] text-[#1F2328] font-bold';
        break;
      default:
        classes = 'bg-[#F3F4F6] hover:bg-gray-200 border-gray-300 text-[#262A2E]';
    }
    if (isSelected) {
      classes += ' ring-2 ring-[#FFC20E] ring-offset-2 ring-offset-white scale-105 z-10';
    }
    return classes;
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleStatusChange = (status: 'green' | 'red' | 'amber' | 'none') => {
    onDayClick(selectedDay, status);
  };

  const handleSaveNote = () => {
    onUpdateNote(selectedDay, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1800);
  };

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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFC20E]/20 text-[#262A2E] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#262A2E]" />
          </div>
          <h3 className="font-bold text-[#262A2E] text-sm">Interactive Safety Cross</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
          <span className="text-emerald-600 font-semibold">Safe: {greenDays}</span>
          <span>·</span>
          <span className="text-rose-600 font-semibold">Incidents: {redDays}</span>
        </div>
      </div>

      {/* LTI Counter & Safety Analytics Panel */}
      <div className="space-y-2.5">
        <div className="p-3.5 bg-[#F7F8F9] rounded-xl border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-wider">
              Days Since Last LTI
            </span>
            <span className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 tabular-nums">
              {daysSinceLastLTI}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onIncrementLTI}
              className="px-2.5 py-1 text-[10px] font-bold bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] rounded-md transition-colors cursor-pointer font-mono"
            >
              +1 Day
            </button>
            <button
              type="button"
              onClick={onResetLTI}
              className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition-colors cursor-pointer font-mono"
            >
              Reset (0)
            </button>
          </div>
        </div>

        {/* Live Safety Analytics */}
        <div className="grid grid-cols-4 gap-2 p-2.5 bg-[#F7F8F9] border border-gray-200 rounded-xl text-center">
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Compliance</span>
            <span className="text-xs font-black font-mono text-[#262A2E]">{complianceRate}%</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Streak</span>
            <span className="text-xs font-black font-mono text-emerald-600">{getGreenStreak()}d</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Incidents</span>
            <span className="text-xs font-black font-mono text-rose-600">{redDays}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Near-Miss</span>
            <span className="text-xs font-black font-mono text-amber-600">{amberDays}</span>
          </div>
        </div>
      </div>

      {/* Safety Cross 31-day Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1.5 pl-6">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

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

            const outlineClass = hasRed
              ? 'border border-rose-200 bg-rose-50/30'
              : hasAmber
              ? 'border border-[#FFC20E]/40 bg-[#FFFBEB]'
              : hasGreen
              ? 'border border-emerald-200 bg-emerald-50/20'
              : 'border border-gray-100 bg-white';

            return (
              <div
                key={wIdx}
                className={`p-1 rounded-lg transition-all flex items-center gap-1.5 ${outlineClass}`}
              >
                <span className={`text-[9px] font-bold font-mono w-4 text-center select-none uppercase ${
                  hasRed ? 'text-rose-600' : hasAmber ? 'text-amber-700' : hasGreen ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {week.label}
                </span>

                <div className="grid grid-cols-7 gap-1.5 flex-1">
                  {week.days.map((item, dIdx) => {
                    if (item.type === 'placeholder') {
                      return <div key={dIdx} className="aspect-square rounded-md" />;
                    }
                    const dayVal = item.val!;
                    const status = safetyCross[dayVal] || 'none';
                    const hasNote = !!safetyNotes[dayVal];
                    const isSelected = selectedDay === dayVal;
                    return (
                      <button
                        key={dIdx}
                        type="button"
                        onClick={() => handleSelectDay(dayVal)}
                        onMouseEnter={() => setHoveredDay(dayVal)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`aspect-square relative flex flex-col items-center justify-center text-xs font-mono font-bold rounded-md border transition-all cursor-pointer ${getStatusColor(status, isSelected)}`}
                      >
                        <span>{dayVal}</span>
                        {hasNote && (
                          <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                            status === 'none' || status === 'amber' ? 'bg-[#262A2E]' : 'bg-white'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Non-obstructive hover preview strip */}
        {hoveredDay !== null && (
          <div className="px-3 py-2 bg-[#F7F8F9] border border-gray-200 rounded-lg text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-bold text-[#262A2E] shrink-0">Day {hoveredDay}:</span>
              <span className="text-gray-600 truncate">
                {safetyNotes[hoveredDay] || 'No safety notes logged.'}
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase text-gray-500 shrink-0">
              {safetyCross[hoveredDay] || 'unlogged'}
            </span>
          </div>
        )}
      </div>

      {/* Selected Day Log & Note Panel */}
      <div className="bg-[#F7F8F9] p-3.5 rounded-xl border border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <span className="text-xs font-bold text-[#262A2E] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#3A3F45]" />
            Day {selectedDay} Safety Log
          </span>
          <div className="flex items-center gap-1">
            {(['green', 'red', 'amber', 'none'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  (safetyCross[selectedDay] || 'none') === s
                    ? s === 'green'
                      ? 'bg-emerald-600 text-white'
                      : s === 'red'
                      ? 'bg-rose-600 text-white'
                      : s === 'amber'
                      ? 'bg-[#FFC20E] text-[#1F2328]'
                      : 'bg-[#3A3F45] text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {s === 'none' ? 'clear' : s === 'green' ? 'safe' : s === 'red' ? 'incident' : 'near-miss'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono">
              Shift Observation
            </span>
            <VoiceInputButton
              onTranscript={(txt) => setNoteText((prev) => prev ? `${prev} ${txt}` : txt)}
            />
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="Add shift safety notes or audit observations..."
            rows={2}
            className="w-full text-xs p-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-3 py-1 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-[10px] font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors font-mono"
            >
              <Check className="w-3 h-3" /> {noteSaved ? 'Saved' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-3 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span>Safe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FFC20E]" />
          <span>Near-Miss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500" />
          <span>Incident</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#F3F4F6] border border-gray-300" />
          <span>No Log</span>
        </div>
      </div>
    </div>
  );
}
