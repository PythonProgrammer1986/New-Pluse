import React, { useState, useEffect, useRef } from 'react';
import { 
  MetricWidget, ProjectTrackRecord, Employee, Pillar, PulseLevel 
} from '../types';
import { ScribeAction, ScribeResponse } from '../services/huddleScribeService';
import { 
  Mic, MicOff, Sparkles, Check, AlertTriangle, X, Play, Pause, 
  ArrowRight, Shield, RefreshCw, Zap, Clock, Send, Volume2, FolderKanban, Plus
} from 'lucide-react';

interface HuddleScribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: MetricWidget[];
  projects: ProjectTrackRecord[];
  employees: Employee[];
  onUpdateWidgetValue: (id: string, updates: Partial<MetricWidget>) => void;
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
  
  // Pending actions waiting for confirmation/auto-apply
  const [pendingActions, setPendingActions] = useState<Array<ScribeAction & { timer?: number }>>([]);
  const [executedActions, setExecutedActions] = useState<Array<{ id: string; title: string; time: string; type: string }>>([]);
  const [autoApply, setAutoApply] = useState(true);
  const [sessionTranscript, setSessionTranscript] = useState<Array<{ id: string; text: string; time: string }>>([]);
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const autoApplyTimerRef = useRef<{ [actionId: string]: any }>({});
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<any>(null);

  // Check speech support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Teardown when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopListeningSession();
    }
  }, [isOpen]);

  // Clean up all resources on unmount
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
      } catch {}
      recognitionRef.current = null;
    }

    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {}
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  const startListeningSession = async () => {
    setMicPermissionError(null);
    setInterimText('');

    // Step 1: Explicitly request audio permission from the user gesture
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
      } catch (err: any) {
        console.warn('getUserMedia permission error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermissionError('Microphone permission was denied. Please click the lock or camera/mic icon in your browser address bar to allow microphone access, then click Start Live Scribe again.');
          return;
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMicPermissionError('No microphone detected on your system. Please connect an audio input device.');
          return;
        } else {
          setMicPermissionError(`Could not access microphone: ${err.message || 'Device error'}`);
          return;
        }
      }
    }

    // Step 2: Set up AudioContext volume meter so the user sees real-time sound feedback
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
            // Map to 0 - 100 with sensitivity amplification
            const vol = Math.min(100, Math.round((avg / 128) * 100 * 1.8));
            setAudioVolume(vol);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          animFrameRef.current = requestAnimationFrame(updateVolume);
        }
      } catch (e) {
        console.warn('AudioContext volume meter initialization skipped:', e);
      }
    }

    // Step 3: Initialize SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      isListeningRef.current = true;
      setIsListening(true);
      setMicPermissionError('Your browser does not natively support Web Speech Recognition (common in Firefox). Microphone hardware is active and detecting volume; please type statements or click the quick simulation presets.');
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
        console.warn('Speech recognition notice/error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionError('Microphone permission blocked by browser policy. Check site permissions in the URL bar.');
          stopListeningSession();
        } else if (event.error === 'network') {
          setMicPermissionError('Speech recognition cloud network service temporarily unavailable. You can use manual input or the one-click simulation buttons.');
        } else if (event.error === 'audio-capture') {
          setMicPermissionError('No audio input detected. Please verify your microphone is plugged in and unmuted.');
          stopListeningSession();
        } else if (event.error === 'no-speech') {
          // Normal silence, don't terminate
        }
      };

      recognition.onend = () => {
        // Automatically restart if user still has listening mode active
        if (isListeningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // If it fails to restart, try recreating once
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
                } catch {}
              }
            }
          }, 200);
        }
      };

      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e: any) {
      console.warn('Speech recognition start failed:', e);
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
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSessionTranscript(prev => [{ id: `ts-${Date.now()}`, text: statementText, time: timeNow }, ...prev]);

    try {
      const response = await fetch('/api/huddle-scribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText: statementText,
          context: {
            widgets: widgets.map(w => ({
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
            projects: projects.map(p => ({
              id: p.id,
              name: p.name,
              code: p.code,
              owner: p.owner
            })),
            employees: employees.map(e => ({
              id: e.id,
              name: e.name
            }))
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Scribe server returned status ${response.status}`);
      }

      const data: ScribeResponse = await response.json();
      
      if (data.actions && data.actions.length > 0) {
        // Enqueue actions
        const newActionsWithTimers = data.actions.map(act => ({
          ...act,
          timer: autoApply ? 5 : undefined
        }));

        setPendingActions(prev => [...newActionsWithTimers, ...prev]);

        // If auto-apply is on, schedule execution
        if (autoApply) {
          data.actions.forEach(act => {
            scheduleAutoApply(act);
          });
        }
      }
    } catch (err) {
      console.error('Failed to parse statement via Scribe API:', err);
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
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
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

        case 'CREATE_NEW_PROJECT': {
          const { name, owner, targetLaunchDate, description } = action.payload;
          onAddProject({
            name: name || 'New Autonomous Project',
            code: `PRJ-${Date.now().toString().slice(-4)}`,
            owner: owner || 'Team Lead',
            targetLaunchDate: targetLaunchDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: description || 'Created live during stand-up huddle.'
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

      // Add to executed ledger
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setExecutedActions(prev => [{
        id: action.id,
        title: action.title,
        time: timeNow,
        type: action.type
      }, ...prev]);

      // Remove from pending
      setPendingActions(prev => prev.filter(a => a.id !== action.id));
    } catch (err) {
      console.error('Error applying action:', err);
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'UPDATE_METRIC_VALUE':
      case 'UPDATE_METRIC_STATE':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'ADD_METRIC_TO_WEEKLY':
        return 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'CREATE_NEW_PROJECT':
        return 'bg-[#FFC20E]/20 text-slate-900 dark:text-[#FFC20E] border-[#FFC20E]/30';
      case 'CREATE_ACTION_ITEM':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'UPDATE_SAFETY_CROSS':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFC20E] flex items-center justify-center text-slate-950 font-black shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  AI Autonomous Huddle Scribe
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-[#FFC20E] text-slate-950 font-mono">
                  Live Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Translating shop-floor stand-up conversations into real-time board updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar / Microphone Controller */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md font-mono ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/40 shadow-rose-900/50'
                  : 'bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 text-white animate-bounce" />
                  <span>Scribe Active (Stop Mic)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-slate-950" />
                  <span>Start Live Scribe (Mic)</span>
                </>
              )}
            </button>

            {isListening && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-bold">Live Audio Stream</span>
                {/* 5-bar dynamic equalizer meter */}
                <div className="flex items-end gap-0.5 h-3.5 pl-1.5 border-l border-rose-800/80">
                  {[0.2, 0.45, 0.75, 0.5, 0.3].map((multiplier, idx) => {
                    const barHeight = Math.max(3, Math.min(14, Math.round((audioVolume * multiplier) / 5)));
                    return (
                      <span
                        key={idx}
                        className={`w-1 rounded-xs transition-all duration-75 ${
                          audioVolume > 15 ? 'bg-emerald-400' : 'bg-rose-400/60'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-rose-200/80">
                  {audioVolume > 10 ? 'Sound detected' : 'Listening...'}
                </span>
              </div>
            )}
          </div>

          {/* Auto-apply toggle */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Zap className={`w-3.5 h-3.5 ${autoApply ? 'text-[#FFC20E]' : 'text-slate-500'}`} />
            <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wider">
              Autonomous Auto-Apply (5s countdown)
            </span>
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="w-4 h-4 accent-[#FFC20E] cursor-pointer"
            />
          </div>
        </div>

        {/* Microphone Permission or Error Warning Banner */}
        {micPermissionError && (
          <div className="px-6 py-2.5 bg-amber-500/15 border-b border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-200 font-mono">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300 block">Microphone Notice:</span>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {micPermissionError}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMicPermissionError(null);
                      startListeningSession();
                    }}
                    className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black rounded uppercase cursor-pointer"
                  >
                    Retry Microphone Access
                  </button>
                  <span className="text-[10px] text-slate-400">
                    or type / click simulation presets below
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMicPermissionError(null)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Hearing Float Banner */}
        {isListening && interimText && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex items-center gap-2 text-amber-700 dark:text-amber-300 font-mono">
            <Volume2 className="w-4 h-4 shrink-0 animate-pulse text-[#FFC20E]" />
            <span className="truncate">&ldquo;{interimText}&rdquo;</span>
          </div>
        )}

        {/* Main Content Workspace: Two Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* Left Column: Input, Quick Tests & Transcript Feed (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Manual statement input */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dictate or Type Meeting Statement
                </label>
                {isProcessing && (
                  <span className="text-[10px] font-bold text-[#FFC20E] flex items-center gap-1 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Analyzing with Gemini...
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
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FFC20E] font-medium"
                />
                <button
                  type="submit"
                  disabled={!manualText.trim() || isProcessing}
                  className="px-4 py-2.5 bg-[#FFC20E] hover:bg-[#E5B200] disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-mono uppercase tracking-wider shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Parse</span>
                </button>
              </form>

              {/* Quick simulation presets */}
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block mb-1.5 font-bold">
                  Quick Simulation Presets (1-Click Test):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_PRESETS.map((demo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessStatement(demo.phrase)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#FFC20E] hover:text-[#FFC20E] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
                      title={demo.phrase}
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rolling Huddle Transcript Log */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Huddle Audio Stream Log ({sessionTranscript.length})
                </span>
                <span className="text-[9px] text-slate-400 font-mono">Realtime session history</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sessionTranscript.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <Mic className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-700" />
                    <span>No speech recorded yet. Speak into your microphone or pick a preset above.</span>
                  </div>
                ) : (
                  sessionTranscript.map(item => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-slate-800 dark:text-slate-200 leading-snug block">
                          &ldquo;{item.text}&rdquo;
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0 mt-0.5">
                        {item.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Pending Actions & Applied Ledger (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Detected Action Cards */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC20E]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Detected Board Actions ({pendingActions.length})
                  </span>
                </div>
                {pendingActions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      pendingActions.forEach(executeAction);
                    }}
                    className="text-[9px] font-black uppercase text-[#FFC20E] hover:underline cursor-pointer font-mono"
                  >
                    Apply All Now
                  </button>
                )}
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {pendingActions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <Check className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      All Board Updates Synchronized
                    </span>
                    <span className="text-[10px] text-slate-400 max-w-xs mt-1">
                      Say or type actions like &ldquo;Hazards was 2&rdquo; or &ldquo;Create project X&rdquo; to trigger instant updates.
                    </span>
                  </div>
                ) : (
                  pendingActions.map(action => (
                    <div 
                      key={action.id}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-50/20 dark:bg-slate-950 space-y-2 relative overflow-hidden shadow-xs animate-fade-in"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${getActionBadgeColor(action.type)}`}>
                          {action.type.replace(/_/g, ' ')}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => executeAction(action)}
                            className="px-2.5 py-1 bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 font-black text-[10px] rounded cursor-pointer uppercase tracking-wider font-mono shadow-xs active:scale-95"
                            title="Confirm and commit to board"
                          >
                            Apply Now
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelAction(action.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                            title="Discard action"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {action.title}
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                          {action.description}
                        </p>
                      </div>

                      {/* Auto-apply countdown indicator */}
                      {autoApply && (
                        <div className="flex items-center justify-between text-[9px] font-mono text-amber-700 dark:text-amber-400 pt-1 border-t border-amber-500/20">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 animate-spin" />
                            Auto-applying in 5s...
                          </span>
                          <button
                            type="button"
                            onClick={() => cancelAction(action.id)}
                            className="underline text-slate-400 hover:text-slate-200"
                          >
                            Pause
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Executed Actions Ledger */}
            {executedActions.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2">
                  ✓ Applied to Huddleboard This Session ({executedActions.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {executedActions.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800/60 font-medium">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Vercel Serverless Ready (/api/huddle-scribe) • Powered by Gemini 3.8 Flash</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer font-mono uppercase tracking-wider"
          >
            Close Scribe
          </button>
        </div>

      </div>
    </div>
  );
}
