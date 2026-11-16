import React, { useState, useEffect } from 'react';
import { MetricWidget, Pillar, ActionItem, Deviation } from '../types';
import VoiceInputButton from './VoiceInputButton';
import {
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft,
  Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat,
  Volume2, VolumeX, AlertTriangle, Plus, Check, Clock,
  X, Sparkles, MessageSquare, Flame
} from 'lucide-react';

interface HuddleRunnerModalProps {
  widgets: MetricWidget[];
  deviations: Deviation[];
  onUpdateWidgetValue: (id: string, updates: Partial<MetricWidget>) => void;
  onAddActionItem: (action: Omit<ActionItem, 'id'>) => void;
  onAddDeviation?: (deviation: Omit<Deviation, 'id'>) => void;
  onClose: () => void;
  onOpenScribe?: () => void;
}

interface PillarSchedule {
  pillar: Pillar;
  allocatedSeconds: number;
  label: string;
}

const PILLAR_SCHEDULE: PillarSchedule[] = [
  { pillar: 'Safety', allocatedSeconds: 150, label: 'Safety (Zero Harm)' },
  { pillar: 'Sustainability', allocatedSeconds: 90, label: 'Sustainability & ESG' },
  { pillar: 'Quality', allocatedSeconds: 210, label: 'Quality & First-Pass Yield' },
  { pillar: 'Delivery', allocatedSeconds: 210, label: 'Delivery & Flow Rate' },
  { pillar: 'Cost', allocatedSeconds: 120, label: 'Cost & Efficiency' },
  { pillar: 'Capital', allocatedSeconds: 120, label: 'Capital & Strategic Capex' }
];

const TOTAL_HUDDLE_SECONDS = 900;

export default function HuddleRunnerModal({
  widgets,
  onUpdateWidgetValue,
  onAddActionItem,
  onClose,
  onOpenScribe
}: HuddleRunnerModalProps) {
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(TOTAL_HUDDLE_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentPillarIndex, setCurrentPillarIndex] = useState<number>(0);
  const [pillarSecondsSpent, setPillarSecondsSpent] = useState<number>(0);

  const [quickActionTitle, setQuickActionTitle] = useState('');
  const [quickActionOwner, setQuickActionOwner] = useState('');
  const [quickActionPriority, setQuickActionPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [actionToastOwner, setActionToastOwner] = useState<string | null>(null);

  const [shiftNote, setShiftNote] = useState('');

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
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio skipped
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && totalSecondsLeft > 0) {
      interval = setInterval(() => {
        setTotalSecondsLeft((prev) => Math.max(0, prev - 1));
        setPillarSecondsSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, totalSecondsLeft]);

  const activePillarConfig = PILLAR_SCHEDULE[currentPillarIndex];
  useEffect(() => {
    if (autoAdvance && isRunning) {
      if (
        pillarSecondsSpent >= activePillarConfig.allocatedSeconds &&
        currentPillarIndex < PILLAR_SCHEDULE.length - 1
      ) {
        playChime();
        setCurrentPillarIndex((prev) => prev + 1);
        setPillarSecondsSpent(0);
      }
    }
  }, [pillarSecondsSpent, autoAdvance, isRunning, currentPillarIndex, activePillarConfig]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const nextPillar = () => {
    if (currentPillarIndex < PILLAR_SCHEDULE.length - 1) {
      playChime();
      setCurrentPillarIndex((prev) => prev + 1);
      setPillarSecondsSpent(0);
    } else {
      onClose();
    }
  };

  const prevPillar = () => {
    if (currentPillarIndex > 0) {
      playChime();
      setCurrentPillarIndex((prev) => prev - 1);
      setPillarSecondsSpent(0);
    }
  };

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

  const elapsedTotal = TOTAL_HUDDLE_SECONDS - totalSecondsLeft;
  let scheduledElapsedUntilCurrent = 0;
  for (let i = 0; i < currentPillarIndex; i++) {
    scheduledElapsedUntilCurrent += PILLAR_SCHEDULE[i].allocatedSeconds;
  }
  const currentPillarTargetTime = scheduledElapsedUntilCurrent + activePillarConfig.allocatedSeconds;
  const isAhead = elapsedTotal <= currentPillarTargetTime;
  const paceDiff = Math.abs(currentPillarTargetTime - elapsedTotal);

  const currentPillarWidgets = widgets.filter(
    (w) => w.pillar === activePillarConfig.pillar && w.level === 'daily'
  );
  const redPillarWidgets = currentPillarWidgets.filter((w) => w.state === 'red');

  const handleQuickLogAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionTitle.trim()) return;

    const assignedOwner = quickActionOwner.trim() || 'Floor Lead';
    onAddActionItem({
      pillar: activePillarConfig.pillar,
      title: quickActionTitle.trim(),
      owner: assignedOwner,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: quickActionPriority,
      status: 'open',
      notes: `Logged during 15-Minute Huddle Runner (${activePillarConfig.pillar}).`
    });

    setQuickActionTitle('');
    setQuickActionOwner('');
    setActionToastOwner(assignedOwner);
    setTimeout(() => setActionToastOwner(null), 3000);
  };

  const ActiveIcon = getPillarIcon(activePillarConfig.pillar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[92vh] overflow-hidden text-[#262A2E]">
        {/* Top Bar */}
        <div className="px-6 py-4 bg-[#F7F8F9] border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFC20E] text-[#1F2328] flex items-center justify-center font-black">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D97706] font-mono">
                  Active Floor Huddle
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  15-MIN RUNNER
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#262A2E] tracking-tight">
                Shop-Floor Daily Standup Stepper
              </h2>
            </div>
          </div>

          {/* Timer Widget */}
          <div className="flex items-center gap-4 bg-white px-5 py-2 rounded-xl border border-gray-200">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D97706]" />
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
                    totalSecondsLeft < 120 ? 'text-rose-600' : 'text-[#262A2E]'
                  }`}
                >
                  {formatTime(totalSecondsLeft)}
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#6B7280] uppercase tracking-widest block">
                Total Remaining
              </span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                title={isRunning ? 'Pause meeting' : 'Resume meeting'}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  isRunning
                    ? 'bg-[#FFFBEB] border border-[#FFC20E] text-[#1F2328] hover:bg-[#FFC20E]'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
                className="p-2 rounded-lg bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setTotalSecondsLeft((prev) => prev + 60)}
                title="Add 1 minute"
                className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-gray-200 text-[10px] font-mono font-bold rounded-lg text-[#3A3F45] cursor-pointer"
              >
                +1m
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
                className="p-2 rounded-lg bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#D97706]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#9CA3AF]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenScribe && (
              <button
                type="button"
                onClick={onOpenScribe}
                className="px-3 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider transition-colors"
                title="Launch AI Huddle Scribe"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Scribe</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-[#4B5563] hover:text-[#262A2E] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="bg-white px-6 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-[#FFC20E] border-[#E5AE00] text-[#1F2328]'
                      : isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-[#F7F8F9] border-gray-200 text-[#4B5563] hover:text-[#262A2E]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>
                    {idx + 1}. {item.pillar}
                  </span>
                  {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={prevPillar}
              disabled={currentPillarIndex === 0}
              className="p-1.5 rounded-lg bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-[#6B7280] font-semibold">
              {currentPillarIndex + 1} / {PILLAR_SCHEDULE.length}
            </span>
            <button
              type="button"
              onClick={nextPillar}
              disabled={currentPillarIndex === PILLAR_SCHEDULE.length - 1}
              className="p-1.5 rounded-lg bg-[#F3F4F6] hover:bg-gray-200 text-[#3A3F45] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <label className="flex items-center gap-1.5 text-[10px] font-mono text-[#4B5563] cursor-pointer ml-2 select-none">
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

        {/* Workspace */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Pillar Focus */}
          <div className="lg:col-span-8 p-6 overflow-y-auto space-y-5 border-r border-gray-200 bg-white">
            <div className="bg-[#F7F8F9] border border-gray-200 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#FFC20E] text-[#1F2328] flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#6B7280] uppercase tracking-widest">
                      Step {currentPillarIndex + 1} of 6
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs font-mono text-[#6B7280]">
                      Allocated: {formatTime(activePillarConfig.allocatedSeconds)}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#262A2E]">{activePillarConfig.label}</h3>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 w-full sm:w-auto justify-between">
                <div>
                  <span className="text-[10px] text-[#6B7280] font-mono uppercase block">Time Spent</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      pillarSecondsSpent > activePillarConfig.allocatedSeconds
                        ? 'text-rose-600'
                        : 'text-[#262A2E]'
                    }`}
                  >
                    {formatTime(pillarSecondsSpent)} / {formatTime(activePillarConfig.allocatedSeconds)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6B7280] font-mono uppercase block">Pace</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded inline-block border ${
                      isAhead
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isAhead ? `+${formatTime(paceDiff)} Ahead` : `-${formatTime(paceDiff)} Behind`}
                  </span>
                </div>
              </div>
            </div>

            {redPillarWidgets.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider font-mono">
                    Attention Required ({redPillarWidgets.length} Deviations Triggered)
                  </h4>
                  <p className="text-xs text-[#3A3F45] mt-1">
                    These metrics missed threshold and should be reviewed or assigned countermeasures:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {redPillarWidgets.map((w) => (
                      <span
                        key={w.id}
                        className="px-2.5 py-1 rounded bg-white text-rose-700 text-xs font-bold border border-rose-200"
                      >
                        {w.title} (Actual: {w.actual ?? w.value} vs Target: {w.target})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider font-mono">
                  Daily {activePillarConfig.pillar} KPIs ({currentPillarWidgets.length})
                </h4>
                <span className="text-[11px] text-[#6B7280]">Click status badge to toggle On Target / Deviation</span>
              </div>

              {currentPillarWidgets.length === 0 ? (
                <div className="text-center py-8 bg-[#F7F8F9] rounded-xl border border-gray-200 text-[#6B7280] text-xs">
                  No daily metrics configured for {activePillarConfig.pillar}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPillarWidgets.map((w) => (
                    <div
                      key={w.id}
                      className={`bg-white border rounded-xl p-4 flex flex-col justify-between transition-colors space-y-3 ${
                        w.state === 'red' ? 'border-rose-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider block">
                            {w.type.toUpperCase()} • {w.owner || 'Floor Operator'}
                          </span>
                          <h5 className="text-sm font-bold text-[#262A2E] mt-0.5">{w.title}</h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = w.state === 'green' ? 'red' : 'green';
                            onUpdateWidgetValue(w.id, { state: nextState });
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                            w.state === 'green'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {w.state === 'green' ? 'On Target' : 'Deviation'}
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-gray-100 font-mono">
                        <div>
                          <span className="text-[10px] text-[#6B7280] block">Actual</span>
                          <span className="text-lg font-extrabold text-[#262A2E]">
                            {w.actual !== undefined
                              ? `${w.actual} ${w.unit || ''}`
                              : w.value !== undefined
                              ? `${w.value} ${w.unit || ''}`
                              : 'Active'}
                          </span>
                        </div>
                        {w.target !== undefined && (
                          <div className="text-right">
                            <span className="text-[10px] text-[#6B7280] block">Target</span>
                            <span className="text-xs font-bold text-[#4B5563]">
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

          {/* Right: Fast Action Logger & Notes */}
          <div className="lg:col-span-4 p-6 bg-[#F7F8F9] flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#D97706]" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#262A2E] font-mono">
                    Fast Countermeasure Log
                  </h4>
                </div>
                <VoiceInputButton
                  onTranscript={(txt) => setQuickActionTitle((prev) => (prev ? `${prev} ${txt}` : txt))}
                />
              </div>

              {actionToastOwner && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 animate-fade-in font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Action assigned to {actionToastOwner}!</span>
                </div>
              )}

              <form onSubmit={handleQuickLogAction} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#4B5563] uppercase font-mono mb-1">
                    Action Title / Task
                  </label>
                  <input
                    type="text"
                    value={quickActionTitle}
                    onChange={(e) => setQuickActionTitle(e.target.value)}
                    placeholder="e.g. Replace worn pneumatic seal"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4B5563] uppercase font-mono mb-1">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={quickActionOwner}
                      onChange={(e) => setQuickActionOwner(e.target.value)}
                      placeholder="e.g. Alex, Sarah"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4B5563] uppercase font-mono mb-1">
                      Priority
                    </label>
                    <select
                      value={quickActionPriority}
                      onChange={(e: any) => setQuickActionPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
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
                  className="w-full py-2.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-lg cursor-pointer transition-colors uppercase tracking-wider font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log Action ({activePillarConfig.pillar})
                </button>
              </form>
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#262A2E] font-mono">
                  <MessageSquare className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Shift Floor Notes</span>
                </div>
                <VoiceInputButton
                  onTranscript={(txt) => setShiftNote((prev) => (prev ? `${prev}\n• ${txt}` : `• ${txt}`))}
                />
              </div>
              <textarea
                value={shiftNote}
                onChange={(e) => setShiftNote(e.target.value)}
                rows={4}
                placeholder="Dictate or type shift handover takeaways..."
                className="w-full p-3 rounded-lg bg-white border border-gray-300 text-xs text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-[#3A3F45] text-xs font-bold rounded-lg cursor-pointer"
              >
                Exit Runner
              </button>
              <button
                type="button"
                onClick={nextPillar}
                className="px-5 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentPillarIndex < PILLAR_SCHEDULE.length - 1 ? 'Next Step' : 'Finish Huddle'}</span>
                {currentPillarIndex < PILLAR_SCHEDULE.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
