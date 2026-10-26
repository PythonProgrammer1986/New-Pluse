import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, ChevronDown } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  placeholderPrompt?: string;
}

// Common industrial shop-floor phrases for 1-click fallback
const QUICK_PHRASES = [
  'Safety checks verified with zero hazards',
  'Part dimension out of tolerance by 0.5mm',
  'Root cause identified as worn hydraulic seal',
  '5S standard work combination sheet updated',
  'Corrective action assigned to maintenance lead',
  'Downtime cleared; station resumed standard rate',
  'Pending quality approval and peer sign-off'
];

export default function VoiceInputButton({
  onTranscript,
  className = '',
  placeholderPrompt = 'Click to dictate notes hands-free'
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
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

        if (finalTrans) {
          onTranscript(finalTrans.trim());
          setInterimText('');
        } else {
          setInterimText(interimTrans);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition initialization skipped:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [onTranscript]);

  const toggleListening = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      setShowQuickPhrases(true);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    } else {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop tracks immediately as speech recognition handles audio in Chrome
          stream.getTracks().forEach(t => t.stop());
        } catch (permErr) {
          console.warn('Microphone permission not granted for VoiceInputButton:', permErr);
          setShowQuickPhrases(true);
          return;
        }
      }

      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error, falling back:', err);
        setIsListening(false);
        setShowQuickPhrases(true);
      }
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'Listening... click to stop' : placeholderPrompt}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm select-none ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-3.5 h-3.5 animate-bounce text-white" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="font-mono text-[10px] hidden sm:inline">Voice Note</span>
          </>
        )}
      </button>

      {/* Quick industrial phrase fallback toggle */}
      <button
        type="button"
        onClick={() => setShowQuickPhrases(!showQuickPhrases)}
        title="Quick industrial phrases"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Live transcript float bubble while speaking */}
      {isListening && interimText && (
        <div className="absolute left-0 bottom-full mb-1 z-50 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap max-w-xs truncate animate-fade-in">
          <span className="text-amber-400 font-bold mr-1">🎙</span>
          {interimText}
        </div>
      )}

      {/* Quick Industrial Phrases Dropdown */}
      {showQuickPhrases && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 space-y-1 animate-fade-in">
          <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
            <span>Quick Shop-Floor Phrases</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {QUICK_PHRASES.map((phrase, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onTranscript(phrase);
                  setShowQuickPhrases(false);
                }}
                className="w-full text-left text-xs p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer leading-snug"
              >
                &ldquo;{phrase}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
