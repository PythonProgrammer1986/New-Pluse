import React, { useState, useEffect, useRef } from 'react';
import { MetricWidget, Pillar, ActionItem, Deviation } from '../types';
import VoiceInputButton from './VoiceInputButton';
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, 
  Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat,
  Volume2, VolumeX, AlertTriangle, Plus, Check, Clock, 
  X, Award, Sparkles, MessageSquare, Flame
} from 'lucide-react';

interface HuddleRunnerModalProps {
  widgets: MetricWidget[];
  deviations: Deviation[];
  onUpdateWidgetValue: (id: string, updates: Partial<MetricWidget>) => void;
  onAddActionItem: (action: Omit<ActionItem, 'id'>) => void;
  onAddDeviation?: (deviation: Omit<Deviation, 'id'>) => void;
  onClose: () => void;
}

interface PillarSchedule {
  pillar: Pillar;
  allocatedSeconds: number;
  label: string;
}

const PILLAR_SCHEDULE: PillarSchedule[] = [
  { pillar: 'Safety', allocatedSeconds: 150, label: 'Safety (Zero Harm)' }, // 2.5 min
  { pillar: 'Sustainability', allocatedSeconds: 90, label: 'Sustainability & ESG' }, // 1.5 min
  { pillar: 'Quality', allocatedSeconds: 210, label: 'Quality & First-Pass Yield' }, // 3.5 min
  { pillar: 'Delivery', allocatedSeconds: 210, label: 'Delivery & Flow Rate' }, // 3.5 min
  { pillar: 'Cost', allocatedSeconds: 120, label: 'Cost & Efficiency' }, // 2.0 min
  { pillar: 'Capital', allocatedSeconds: 120, label: 'Capital & Strategic Capex' } // 2.0 min
];

const TOTAL_HUDDLE_SECONDS = 900; // 15 minutes

export default function HuddleRunnerModal({
  widgets,
  deviations,
  onUpdateWidgetValue,
  onAddActionItem,
  onAddDeviation,
  onClose
}: HuddleRunnerModalProps) {
  // Timer state
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(TOTAL_HUDDLE_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentPillarIndex, setCurrentPillarIndex] = useState<number>(0);
  const [pillarSecondsSpent, setPillarSecondsSpent] = useState<number>(0);

  // Quick Action form inside runner
  const [quickActionTitle, setQuickActionTitle] = useState('');
  const [quickActionOwner, setQuickActionOwner] = useState('');
  const [quickActionPriority, setQuickActionPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [actionSuccessToast, setActionSuccessToast] = useState(false);

  // Shift Voice Notes
  const [shiftNote, setShiftNote] = useState('');

  // Audio Context for Web Audio Synthesizer Chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio chime skipped:', e);
    }
  };

  // Main countdown timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && totalSecondsLeft > 0) {
      interval = setInterval(() => {
        setTotalSecondsLeft((prev) => Math.max(0, prev - 1));
        setPillarSecondsSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSecondsLeft]);

  // Pillar transition / auto-advance check
  const activePillarConfig = PILLAR_SCHEDULE[currentPillarIndex];
  useEffect(() => {
    if (autoAdvance && isRunning) {
      if (pillarSecondsSpent >= activePillarConfig.allocatedSeconds && currentPillarIndex < PILLAR_SCHEDULE.length - 1) {
        playChime();
        setCurrentPillarIndex((prev) => prev + 1);
        setPillarSecondsSpent(0);
      }
    }
  }, [pillarSecondsSpent, autoAdvance, isRunning, currentPillarIndex, activePillarConfig]);

  // Helper formatting mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pillar navigation
  const nextPillar = () => {
    if (currentPillarIndex < PILLAR_SCHEDULE.length - 1) {
      playChime();
      setCurrentPillarIndex((prev) => prev + 1);
      setPillarSecondsSpent(0);
    }
  };

  const prevPillar = () => {
    if (currentPillarIndex > 0) {
      playChime();
      setCurrentPillarIndex((prev) => prev - 1);
      setPillarSecondsSpent(0);
    }
  };

  // Pillar icon helper
  const getPillarIcon = (pillar: Pillar) => {
    switch (pillar) {
      case 'Safety': return Shield;
      case 'Sustainability': return Leaf;
      case 'Quality': return CheckCircle;
      case 'Delivery': return TrendingUp;
      case 'Cost': return Coins;
      case 'Capital': return HardHat;
    }
  };

  // Pace Calculation
  const elapsedTotal = TOTAL_HUDDLE_SECONDS - totalSecondsLeft;
  let scheduledElapsedUntilCurrent = 0;
  for (let i = 0; i < currentPillarIndex; i++) {
    scheduledElapsedUntilCurrent += PILLAR_SCHEDULE[i].allocatedSeconds;
  }
  const currentPillarTargetTime = scheduledElapsedUntilCurrent + activePillarConfig.allocatedSeconds;
  const isAhead = elapsedTotal < currentPillarTargetTime;
  const paceDiff = Math.abs(currentPillarTargetTime - elapsedTotal);

  // Active pillar widgets
  const currentPillarWidgets = widgets.filter(
    (w) => w.pillar === activePillarConfig.pillar && w.level === 'daily'
  );
  const redPillarWidgets = currentPillarWidgets.filter((w) => w.state === 'red');

  // Quick Action Handler
  const handleQuickLogAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionTitle.trim()) return;

    onAddActionItem({
      pillar: activePillarConfig.pillar,
      title: quickActionTitle.trim(),
      owner: quickActionOwner.trim() || 'Floor Lead',
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: quickActionPriority,
      status: 'open',
      notes: `Logged live during 15-Minute Huddle Runner (${activePillarConfig.pillar} discussion).`
    });

    setQuickActionTitle('');
    setQuickActionOwner('');
    setActionSuccessToast(true);
    setTimeout(() => setActionSuccessToast(false), 3000);
  };

  const ActiveIcon = getPillarIcon(activePillarConfig.pillar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col h-[92vh] overflow-hidden text-white">
        
        {/* TOP STATUS BAR: Countdown Clock & Stepper */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          
          {/* Brand & Mode */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFC20E] text-slate-950 flex items-center justify-center shadow-lg shadow-[#FFC20E]/20 font-black">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFC20E] font-mono">
                  Active Floor Huddle
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE 15-MIN RUNNER
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Shop-Floor Daily Standup Stepper
              </h2>
            </div>
          </div>

          {/* Master 15-Minute Countdown Timer */}
          <div className="flex items-center gap-4 bg-slate-900 px-5 py-2 rounded-2xl border border-slate-800">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFC20E]" />
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  totalSecondsLeft < 120 ? 'text-rose-500 animate-pulse' : 'text-white'
                }`}>
                  {formatTime(totalSecondsLeft)}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                Total Remaining
              </span>
            </div>

            {/* Timer Playback Controls */}
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                title={isRunning ? 'Pause meeting' : 'Resume meeting'}
                className={`p-2 rounded-xl cursor-pointer transition-all ${
                  isRunning 
                    ? 'bg-amber-500/20 text-[#FFC20E] hover:bg-amber-500/30' 
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTotalSecondsLeft(TOTAL_HUDDLE_SECONDS);
                  setPillarSecondsSpent(0);
                  setCurrentPillarIndex(0);
                }}
                title="Reset timer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setTotalSecondsLeft((prev) => prev + 60)}
                title="Add 1 minute"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold rounded-lg text-slate-300 cursor-pointer"
              >
                +1m
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FFC20E]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Close Runner */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER NAVIGATION TRAY */}
        <div className="bg-slate-950/60 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            {PILLAR_SCHEDULE.map((item, idx) => {
              const Icon = getPillarIcon(item.pillar);
              const isActive = idx === currentPillarIndex;
              const isDone = idx < currentPillarIndex;

              return (
                <button
                  key={item.pillar}
                  type="button"
                  onClick={() => {
                    playChime();
                    setCurrentPillarIndex(idx);
                    setPillarSecondsSpent(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#FFC20E] text-slate-950 font-black shadow-lg shadow-[#FFC20E]/20 scale-105'
                      : isDone
                      ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{idx + 1}. {item.pillar}</span>
                  {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={prevPillar}
              disabled={currentPillarIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {currentPillarIndex + 1} / {PILLAR_SCHEDULE.length}
            </span>
            <button
              type="button"
              onClick={nextPillar}
              disabled={currentPillarIndex === PILLAR_SCHEDULE.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded accent-[#FFC20E]"
              />
              <span>Auto-advance</span>
            </label>
          </div>
        </div>

        {/* WORKSPACE CONTENT: 2-Column Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* LEFT COLUMN: Active Pillar Dashboard & KPI Focus (8 cols) */}
          <div className="lg:col-span-8 p-6 overflow-y-auto space-y-5 border-r border-slate-800">
            
            {/* Pillar Header Card */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#FFC20E] flex items-center justify-center">
                  <ActiveIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Step {currentPillarIndex + 1} of 6
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-mono text-slate-400">
                      Target: {formatTime(activePillarConfig.allocatedSeconds)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {activePillarConfig.label}
                  </h3>
                </div>
              </div>

              {/* Pillar Pace Progress Ring / Bar */}
              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 w-full sm:w-auto justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Pillar Time Spent
                  </span>
                  <span className={`text-base font-bold font-mono ${
                    pillarSecondsSpent > activePillarConfig.allocatedSeconds ? 'text-rose-400' : 'text-[#FFC20E]'
                  }`}>
                    {formatTime(pillarSecondsSpent)} / {formatTime(activePillarConfig.allocatedSeconds)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Huddle Pace
                  </span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${
                    isAhead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {isAhead ? `+${formatTime(paceDiff)} Ahead` : `-${formatTime(paceDiff)} Behind`}
                  </span>
                </div>
              </div>
            </div>

            {/* Red Deviations Alert Strip if any for this pillar */}
            {redPillarWidgets.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                    Attention Required ({redPillarWidgets.length} Deviations Triggered)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    The following metrics failed standard threshold and require immediate countermeasure assignment:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {redPillarWidgets.map((w) => (
                      <span key={w.id} className="px-2.5 py-1 rounded bg-rose-900/50 text-rose-200 text-xs font-bold border border-rose-800">
                        {w.title} (Actual: {w.actual ?? w.value} vs Target: {w.target})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pillar Metric Cards List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Daily {activePillarConfig.pillar} KPIs ({currentPillarWidgets.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Click status pill to toggle Red / Green
                </span>
              </div>

              {currentPillarWidgets.length === 0 ? (
                <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  No daily metrics configured for {activePillarConfig.pillar}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPillarWidgets.map((w) => (
                    <div
                      key={w.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            {w.type.toUpperCase()} • {w.owner || 'Floor Operator'}
                          </span>
                          <h5 className="text-sm font-bold text-white mt-0.5">
                            {w.title}
                          </h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = w.state === 'green' ? 'red' : 'green';
                            onUpdateWidgetValue(w.id, { state: nextState });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                            w.state === 'green'
                              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              : 'bg-rose-500 text-white animate-pulse hover:bg-rose-400'
                          }`}
                        >
                          {w.state.toUpperCase()}
                        </button>
                      </div>

                      {/* Metric Values */}
                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-900 font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Actual</span>
                          <span className="text-lg font-black text-white">
                            {w.actual !== undefined ? `${w.actual} ${w.unit || ''}` : w.value !== undefined ? `${w.value} ${w.unit || ''}` : 'Active'}
                          </span>
                        </div>
                        {w.target !== undefined && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Target</span>
                            <span className="text-xs font-bold text-slate-400">
                              {w.target} {w.unit || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Quick Action Logger & Voice Notes (4 cols) */}
          <div className="lg:col-span-4 p-6 bg-slate-950/40 flex flex-col justify-between space-y-6 overflow-y-auto">
            
            {/* Quick Action Logger Form */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#FFC20E]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    Fast Countermeasure Log
                  </h4>
                </div>
                <VoiceInputButton
                  onTranscript={(txt) => setQuickActionTitle((prev) => prev ? `${prev} ${txt}` : txt)}
                />
              </div>

              {actionSuccessToast && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in font-bold">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Action item assigned to {quickActionOwner || 'Floor Lead'}!</span>
                </div>
              )}

              <form onSubmit={handleQuickLogAction} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                    Action Title / Task
                  </label>
                  <input
                    type="text"
                    value={quickActionTitle}
                    onChange={(e) => setQuickActionTitle(e.target.value)}
                    placeholder="e.g. Replace worn pneumatic seal, re-torque flange"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFC20E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={quickActionOwner}
                      onChange={(e) => setQuickActionOwner(e.target.value)}
                      placeholder="e.g. Alex, Sarah"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFC20E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">
                      Priority
                    </label>
                    <select
                      value={quickActionPriority}
                      onChange={(e: any) => setQuickActionPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#FFC20E]"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!quickActionTitle.trim()}
                  className="w-full py-2.5 bg-[#FFC20E] hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-[#FFC20E]/20 transition-all uppercase tracking-wider font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log Action Item ({activePillarConfig.pillar})
                </button>
              </form>
            </div>

            {/* Hands-Free Live Shift Notes Area */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-mono">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FFC20E]" />
                  <span>Shift Floor Notes</span>
                </div>
                <VoiceInputButton
                  onTranscript={(txt) => setShiftNote((prev) => prev ? `${prev}\n• ${txt}` : `• ${txt}`)}
                />
              </div>
              <textarea
                value={shiftNote}
                onChange={(e) => setShiftNote(e.target.value)}
                rows={4}
                placeholder="Dictate or type shift handover takeaways..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFC20E] resize-none"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Exit Runner
              </button>
              <button
                type="button"
                onClick={nextPillar}
                className="px-5 py-2 bg-[#FFC20E] hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer flex items-center gap-2"
              >
                <span>{currentPillarIndex < PILLAR_SCHEDULE.length - 1 ? 'Next Step &rarr;' : 'Finish Huddle'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
