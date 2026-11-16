import React, { useState, useEffect, useRef } from 'react';
import { MetricWidget, ProjectTrackRecord, Employee, Pillar, PulseLevel } from '../types';
import {
  ScribeAction,
  ScribeResponse,
  intelligentFallbackParser,
  ScribeContext
} from '../services/huddleScribeParser';
import {
  Mic, Sparkles, Check, AlertTriangle, X,
  RefreshCw, Zap, Clock, Send, Volume2,
  Key, ExternalLink, HelpCircle
} from 'lucide-react';

interface HuddleScribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: MetricWidget[];
  projects: ProjectTrackRecord[];
  employees: Employee[];
  onUpdateWidgetValue: (id: string, updates: Partial<MetricWidget>) => void;
  onAddWidget?: (widget: Omit<MetricWidget, 'id' | 'state'>) => void;
  onAddMetricToWeekly: (id: string) => void;
  onAddProject: (project: Omit<ProjectTrackRecord, 'id' | 'points' | 'overallStatus'>) => void;
  onAddActionItem: (action: any) => void;
  onUpdateSafetyCross: (dayIndex: number, status: 'green' | 'red' | 'amber' | 'none') => void;
  onUpdateSafetyNote?: (dayIndex: number, note: string) => void;
}

const DEMO_PRESETS = [
  {
    label: 'Hazard Spike (Red)',
    phrase: 'Daily Hazards Identified reached 2 today near the Station 3 hydraulic line'
  },
  {
    label: 'Escalate to Weekly',
    phrase: 'Please add Daily Energy Consumption deviation to weekly analysis'
  },
  {
    label: 'New Rig Project',
    phrase: 'Create new project: Rig Hydraulic Loop Optimization, owner Sarah Connor, target December 20th'
  },
  {
    label: 'Assign Countermeasure',
    phrase: 'Assign Dave Miller to replace worn hydraulic seals by Friday high priority'
  },
  {
    label: 'Log Safety Day',
    phrase: 'Log day 24 on the safety cross as green with zero incidents'
  }
];

export default function HuddleScribeModal({
  isOpen,
  onClose,
  widgets,
  projects,
  employees,
  onUpdateWidgetValue,
  onAddWidget,
  onAddMetricToWeekly,
  onAddProject,
  onAddActionItem,
  onUpdateSafetyCross,
  onUpdateSafetyNote
}: HuddleScribeModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [serverHealth, setServerHealth] = useState<{ hasGeminiKey: boolean; environment?: string } | null>(null);
  const [showVercelKeyGuide, setShowVercelKeyGuide] = useState(false);
  const [activeEngineModel, setActiveEngineModel] = useState<string>('Detecting engine...');

  const [pendingActions, setPendingActions] = useState<Array<ScribeAction & { timer?: number }>>([]);
  const [executedActions, setExecutedActions] = useState<
    Array<{ id: string; title: string; time: string; type: string }>
  >([]);
  const [autoApply, setAutoApply] = useState(true);
  const [sessionTranscript, setSessionTranscript] = useState<
    Array<{ id: string; text: string; time: string }>
  >([]);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const autoApplyTimerRef = useRef<{ [actionId: string]: ReturnType<typeof setTimeout> }>({});
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerHealth(data);
        if (data.hasGeminiKey) {
          setActiveEngineModel('Gemini AI Active');
        } else {
          setActiveEngineModel('Local Autonomous Parser');
        }
      })
      .catch(() => {
        setServerHealth({ hasGeminiKey: false });
        setActiveEngineModel('Local Autonomous Parser');
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopListeningSession();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopListeningSession();
    };
  }, []);

  const stopListeningSession = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    setAudioVolume(0);

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore cleanup error
      }
      recognitionRef.current = null;
    }

    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore
      }
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
  };

  const startListeningSession = async () => {
    setMicPermissionError(null);
    setInterimText('');

    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermissionError(
            'Microphone permission was denied. Allow microphone access in browser permissions, then click Start Live Scribe.'
          );
          return;
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMicPermissionError('No microphone detected on this system.');
          return;
        } else {
          setMicPermissionError(`Could not access microphone: ${err.message || 'Device error'}`);
          return;
        }
      }
    }

    if (stream) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.4;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!isListeningRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const vol = Math.min(100, Math.round((avg / 128) * 100 * 1.8));
            setAudioVolume(vol);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          animFrameRef.current = requestAnimationFrame(updateVolume);
        }
      } catch {
        // Volume meter optional
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      isListeningRef.current = true;
      setIsListening(true);
      setMicPermissionError(
        'Browser speech recognition is unavailable. Microphone audio is live, or type statements / click quick presets below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setMicPermissionError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }

        if (finalTrans && finalTrans.trim().length > 3) {
          handleProcessStatement(finalTrans.trim());
          setInterimText('');
        } else {
          setInterimText(interimTrans);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicPermissionError('Microphone permission blocked by browser policy.');
          stopListeningSession();
        } else if (event.error === 'network') {
          setMicPermissionError(
            'Speech recognition network unavailable. Use manual statement input or one-click presets below.'
          );
        } else if (event.error === 'audio-capture') {
          setMicPermissionError('No audio input detected. Check microphone connection.');
          stopListeningSession();
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                try {
                  const newRec = new SpeechRecognition();
                  newRec.continuous = true;
                  newRec.interimResults = true;
                  newRec.lang = 'en-US';
                  newRec.onstart = recognition.onstart;
                  newRec.onresult = recognition.onresult;
                  newRec.onerror = recognition.onerror;
                  newRec.onend = recognition.onend;
                  recognitionRef.current = newRec;
                  newRec.start();
                } catch {
                  // Ignore
                }
              }
            }
          }, 200);
        }
      };

      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        setMicPermissionError(`Could not start speech recognition: ${e.message || 'Unknown error'}`);
      }
      isListeningRef.current = true;
      setIsListening(true);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListeningSession();
    } else {
      startListeningSession();
    }
  };

  const handleProcessStatement = async (statementText: string) => {
    if (!statementText.trim() || isProcessing) return;

    setIsProcessing(true);
    const timeNow = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setSessionTranscript((prev) => [{ id: `ts-${Date.now()}`, text: statementText, time: timeNow }, ...prev]);

    const currentContext: ScribeContext = {
      widgets: widgets.map((w) => ({
        id: w.id,
        title: w.title,
        pillar: w.pillar,
        level: w.level,
        actual: w.actual,
        target: w.target,
        value: w.value,
        state: w.state,
        owner: w.owner
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        owner: p.owner
      })),
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name
      }))
    };

    let data: ScribeResponse | null = null;

    try {
      const response = await fetch('/api/huddle-scribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText: statementText,
          context: currentContext
        })
      });

      if (response.ok) {
        data = await response.json();
      }
    } catch {
      // Fall back locally
    }

    if (!data || !data.actions || data.actions.length === 0) {
      data = intelligentFallbackParser(statementText, currentContext);
    }

    try {
      if (data && data.actions && data.actions.length > 0) {
        if (data.modelUsed) {
          setActiveEngineModel(data.modelUsed);
        }
        const newActionsWithTimers = data.actions.map((act) => ({
          ...act,
          timer: autoApply ? 5 : undefined
        }));

        setPendingActions((prev) => [...newActionsWithTimers, ...prev]);

        if (autoApply) {
          data.actions.forEach((act) => {
            scheduleAutoApply(act);
          });
        }
      }
    } finally {
      setIsProcessing(false);
      setManualText('');
    }
  };

  const scheduleAutoApply = (action: ScribeAction) => {
    if (autoApplyTimerRef.current[action.id]) {
      clearTimeout(autoApplyTimerRef.current[action.id]);
    }
    autoApplyTimerRef.current[action.id] = setTimeout(() => {
      executeAction(action);
    }, 5000);
  };

  const cancelAction = (actionId: string) => {
    if (autoApplyTimerRef.current[actionId]) {
      clearTimeout(autoApplyTimerRef.current[actionId]);
      delete autoApplyTimerRef.current[actionId];
    }
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
  };

  const executeAction = (action: ScribeAction) => {
    if (autoApplyTimerRef.current[action.id]) {
      clearTimeout(autoApplyTimerRef.current[action.id]);
      delete autoApplyTimerRef.current[action.id];
    }

    try {
      switch (action.type) {
        case 'UPDATE_METRIC_VALUE': {
          const { widgetId, actual, notes } = action.payload;
          if (widgetId) {
            onUpdateWidgetValue(widgetId, {
              actual,
              ...(notes ? { description: notes } : {})
            });
          }
          break;
        }

        case 'UPDATE_METRIC_STATE': {
          const { widgetId, state } = action.payload;
          if (widgetId) {
            onUpdateWidgetValue(widgetId, { state });
          }
          break;
        }

        case 'ADD_METRIC_TO_WEEKLY': {
          const { widgetId } = action.payload;
          if (widgetId) {
            onAddMetricToWeekly(widgetId);
          }
          break;
        }

        case 'CREATE_NEW_METRIC': {
          if (onAddWidget) {
            const { title, pillar, level, actual, target, unit, owner, description } = action.payload;
            onAddWidget({
              title: title || 'New Operational KPI',
              pillar: (pillar as Pillar) || 'Quality',
              level: (level as PulseLevel) || 'daily',
              type: 'numeric',
              actual: typeof actual === 'number' ? actual : 0,
              target: typeof target === 'number' ? target : 100,
              unit: unit || '',
              owner: owner || 'Floor Lead',
              description: description || 'Created via AI Huddle Scribe.'
            });
          }
          break;
        }

        case 'CREATE_NEW_PROJECT': {
          const { name, owner, targetLaunchDate, description } = action.payload;
          onAddProject({
            name: name || 'New Operations Project',
            code: `PRJ-${Date.now().toString().slice(-4)}`,
            owner: owner || 'Team Lead',
            targetLaunchDate:
              targetLaunchDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: description || 'Created during stand-up huddle.'
          });
          break;
        }

        case 'CREATE_ACTION_ITEM': {
          const { title, pillar, owner, dueDate, priority, notes } = action.payload;
          onAddActionItem({
            title: title || 'Follow up operational action',
            pillar: pillar || 'Quality',
            owner: owner || 'Shift Supervisor',
            dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: priority || 'high',
            status: 'open',
            notes: notes || 'Created via AI Huddle Scribe.'
          });
          break;
        }

        case 'UPDATE_SAFETY_CROSS': {
          const { dayIndex, status, note } = action.payload;
          if (dayIndex >= 1 && dayIndex <= 31) {
            onUpdateSafetyCross(dayIndex, status);
            if (note && onUpdateSafetyNote) {
              onUpdateSafetyNote(dayIndex, note);
            }
          }
          break;
        }
      }

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setExecutedActions((prev) => [
        {
          id: action.id,
          title: action.title,
          time: timeNow,
          type: action.type
        },
        ...prev
      ]);

      setPendingActions((prev) => prev.filter((a) => a.id !== action.id));
    } catch (err) {
      console.error('Error applying action:', err);
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'UPDATE_METRIC_VALUE':
      case 'UPDATE_METRIC_STATE':
      case 'CREATE_NEW_METRIC':
        return 'bg-[#F3F4F6] text-[#262A2E] border-gray-300';
      case 'ADD_METRIC_TO_WEEKLY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CREATE_NEW_PROJECT':
        return 'bg-[#FFFBEB] text-[#1F2328] border-[#FFC20E]';
      case 'CREATE_ACTION_ITEM':
      case 'UPDATE_SAFETY_CROSS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-[#F3F4F6] text-[#3A3F45] border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-[#F7F8F9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFC20E] flex items-center justify-center text-[#1F2328]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#262A2E]">
                  AI Autonomous Huddle Scribe
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#FFC20E] text-[#1F2328] font-mono">
                  Live Copilot
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                Translating stand-up discussions into real-time board updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {serverHealth?.hasGeminiKey ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Gemini AI Active</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowVercelKeyGuide(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFBEB] border border-[#FFC20E] text-[#1F2328] hover:bg-[#FFC20E]/20 transition-colors text-[10px] font-mono font-bold cursor-pointer"
                title="View instructions for configuring GEMINI_API_KEY on Vercel"
              >
                <Key className="w-3 h-3 text-[#D97706]" />
                <span className="hidden md:inline">Connect Gemini on Vercel</span>
                <span className="md:hidden">Add Key</span>
                <HelpCircle className="w-3 h-3 opacity-70" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#262A2E] hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Microphone Controller */}
        <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer font-mono ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328]'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isListening ? 'Scribe Active (Stop Mic)' : 'Start Live Scribe (Mic)'}</span>
            </button>

            {isListening && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span className="font-bold">Live Audio</span>
                <div className="flex items-end gap-0.5 h-3.5 pl-1.5 border-l border-rose-200">
                  {[0.2, 0.45, 0.75, 0.5, 0.3].map((multiplier, idx) => {
                    const barHeight = Math.max(3, Math.min(14, Math.round((audioVolume * multiplier) / 5)));
                    return (
                      <span
                        key={idx}
                        className={`w-1 rounded-xs transition-all duration-75 ${
                          audioVolume > 15 ? 'bg-emerald-600' : 'bg-rose-400'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px]">
                  {audioVolume > 10 ? 'Sound detected' : 'Listening...'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#F7F8F9] px-3 py-1.5 rounded-xl border border-gray-200">
            <Zap className={`w-3.5 h-3.5 ${autoApply ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`} />
            <span className="text-[10px] font-bold text-[#3A3F45] font-mono uppercase tracking-wider">
              Auto-Apply (5s countdown)
            </span>
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="w-4 h-4 accent-[#FFC20E] cursor-pointer"
            />
          </div>
        </div>

        {/* Mic Warning */}
        {micPermissionError && (
          <div className="px-6 py-2.5 bg-[#FFFBEB] border-b border-[#FFC20E]/40 flex items-start justify-between gap-3 text-xs text-[#262A2E] font-mono">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Microphone Notice</span>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">{micPermissionError}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMicPermissionError(null);
                      startListeningSession();
                    }}
                    className="px-2 py-0.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-[10px] font-bold rounded uppercase cursor-pointer"
                  >
                    Retry Mic
                  </button>
                  <span className="text-[10px] text-[#6B7280]">or type / select a preset below</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMicPermissionError(null)}
              className="p-1 text-[#6B7280] hover:text-[#262A2E] rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interim Speech Banner */}
        {isListening && interimText && (
          <div className="px-6 py-2 bg-[#FFFBEB] border-b border-[#FFC20E]/40 text-xs flex items-center gap-2 text-[#1F2328] font-mono">
            <Volume2 className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span className="truncate">&ldquo;{interimText}&rdquo;</span>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#F7F8F9]">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4B5563]">
                  Dictate or Type Meeting Statement
                </label>
                {isProcessing && (
                  <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-1 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessStatement(manualText);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="e.g. Daily Hazards was 2 today, assign Dave to inspect guide-rails..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
                />
                <button
                  type="submit"
                  disabled={!manualText.trim() || isProcessing}
                  className="px-4 py-2.5 bg-[#FFC20E] hover:bg-[#E5AE00] disabled:opacity-40 text-[#1F2328] font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-mono uppercase tracking-wider shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Parse</span>
                </button>
              </form>

              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#6B7280] block mb-1.5 font-bold">
                  Quick Simulation Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_PRESETS.map((demo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessStatement(demo.phrase)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-gray-300 bg-white hover:border-[#FFC20E] hover:bg-[#FFFBEB] text-[#262A2E] transition-colors cursor-pointer"
                      title={demo.phrase}
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4B5563]">
                  Huddle Transcript Log ({sessionTranscript.length})
                </span>
                <span className="text-[9px] text-[#6B7280] font-mono">
                  {speechSupported ? 'Session History' : 'Manual Mode'}
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sessionTranscript.length === 0 ? (
                  <div className="py-8 text-center text-[#6B7280] text-xs">
                    <Mic className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
                    <span>No speech recorded yet. Speak into your mic or click a preset above.</span>
                  </div>
                ) : (
                  sessionTranscript.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-[#F7F8F9] border border-gray-200 text-xs flex items-start justify-between gap-3"
                    >
                      <span className="text-[#262A2E] leading-snug flex-1">&ldquo;{item.text}&rdquo;</span>
                      <span className="text-[9px] font-mono text-[#6B7280] shrink-0 mt-0.5">{item.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#262A2E]">
                    Detected Board Actions ({pendingActions.length})
                  </span>
                </div>
                {pendingActions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      [...pendingActions].forEach(executeAction);
                    }}
                    className="text-[10px] font-extrabold uppercase text-[#D97706] hover:underline cursor-pointer font-mono"
                  >
                    Apply All Now
                  </button>
                )}
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {pendingActions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center text-[#6B7280]">
                    <Check className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-xs font-bold text-[#262A2E]">All Board Updates Synchronized</span>
                    <span className="text-[10px] text-[#6B7280] max-w-xs mt-1">
                      Say or type actions like &ldquo;Hazards was 2&rdquo; or &ldquo;Create project X&rdquo;.
                    </span>
                  </div>
                ) : (
                  pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-3 rounded-xl border border-[#FFC20E] bg-[#FFFBEB] space-y-2 animate-fade-in"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${getActionBadgeColor(
                            action.type
                          )}`}
                        >
                          {action.type.replace(/_/g, ' ')}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => executeAction(action)}
                            className="px-2.5 py-1 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-extrabold text-[10px] rounded cursor-pointer uppercase tracking-wider font-mono"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelAction(action.id)}
                            className="p-1 hover:bg-white rounded text-[#6B7280] hover:text-rose-600 cursor-pointer"
                            title="Discard"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-xs text-[#262A2E]">{action.title}</h5>
                        <p className="text-[11px] text-[#4B5563] mt-0.5 leading-snug">{action.description}</p>
                      </div>

                      {autoApply && (
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#D97706] pt-1 border-t border-[#FFC20E]/30">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Auto-applying in 5s...
                          </span>
                          <button
                            type="button"
                            onClick={() => cancelAction(action.id)}
                            className="underline text-[#4B5563] hover:text-[#262A2E] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {executedActions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block mb-2">
                  Applied This Session ({executedActions.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {executedActions.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-gray-100 font-medium"
                    >
                      <span className="text-[#262A2E] truncate max-w-[80%]">{item.title}</span>
                      <span className="text-[9px] font-mono text-[#6B7280] shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#6B7280] text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                serverHealth?.hasGeminiKey ? 'bg-emerald-500' : 'bg-[#FFC20E]'
              }`}
            ></span>
            <span>
              Engine: <strong className="text-[#262A2E]">{activeEngineModel}</strong>
            </span>
            <span className="text-gray-300">•</span>
            <span>
              Endpoint: <code>/api/huddle-scribe</code>
            </span>
            {!serverHealth?.hasGeminiKey && (
              <button
                type="button"
                onClick={() => setShowVercelKeyGuide(true)}
                className="text-[#D97706] underline hover:text-[#262A2E] ml-1 cursor-pointer font-bold"
              >
                Setup Vercel Key
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#262A2E] hover:bg-[#3A3F45] text-white font-bold rounded-lg text-xs cursor-pointer font-mono uppercase tracking-wider"
          >
            Close Scribe
          </button>
        </div>
      </div>

      {/* Vercel Guide Sub-Modal */}
      {showVercelKeyGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFC20E] flex items-center justify-center text-[#1F2328]">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-[#262A2E]">
                    Connect Gemini Key on Vercel
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-mono">
                    Server-side environment variable configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVercelKeyGuide(false)}
                className="p-1 rounded text-[#6B7280] hover:text-[#262A2E] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#3A3F45]">
              <p className="leading-relaxed">
                To power AI Scribe on Vercel with <strong>Gemini Flash</strong>, add your API key securely in Vercel
                Project Settings:
              </p>

              <div className="bg-[#F7F8F9] border border-gray-200 p-3.5 rounded-xl space-y-2.5 font-mono text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFC20E] text-[#1F2328] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <span>Go to your </span>
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D97706] underline inline-flex items-center gap-0.5 font-bold"
                    >
                      Vercel Dashboard <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    <span> and select this project.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFC20E] text-[#1F2328] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <span>
                      Click <strong>Settings</strong> → <strong>Environment Variables</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFC20E] text-[#1F2328] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div className="space-y-1">
                    <div>
                      <span>Key Name: </span>
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-[#262A2E] font-bold">
                        GEMINI_API_KEY
                      </code>
                    </div>
                    <div>
                      <span>Value: </span>
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-[#3A3F45]">
                        AIzaSy... (from Google AI Studio)
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFC20E] text-[#1F2328] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    4
                  </span>
                  <div>
                    <span>
                      Select <strong>Production</strong>, <strong>Preview</strong>, and <strong>Development</strong>,
                      then click <strong>Save</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFC20E] text-[#1F2328] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    5
                  </span>
                  <div>
                    <span>
                      Open <strong>Deployments</strong> and click <strong>Redeploy</strong>.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                <strong>Instant Fallback Active:</strong> Even without a Gemini key, the built-in rule engine handles
                spoken and typed updates automatically.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#D97706] hover:underline flex items-center gap-1 font-mono font-bold"
              >
                <span>Get a Gemini API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setShowVercelKeyGuide(false)}
                className="px-4 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-extrabold text-xs rounded-xl cursor-pointer uppercase font-mono tracking-wider"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
