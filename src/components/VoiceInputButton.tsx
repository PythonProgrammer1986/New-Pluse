import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, ChevronDown } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  placeholderPrompt?: string;
}

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

      recognition.onerror = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    } catch {
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
          stream.getTracks().forEach(t => t.stop());
        } catch {
          setShowQuickPhrases(true);
          return;
        }
      }

      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
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
        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
            : 'bg-white hover:bg-[#FFFBEB] text-[#262A2E] border border-gray-300 hover:border-[#FFC20E]'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-3.5 h-3.5 animate-bounce text-white" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-[#3A3F45]" />
            <span className="font-mono text-[10px] hidden sm:inline">Voice</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setShowQuickPhrases(!showQuickPhrases)}
        title="Quick shop-floor phrases"
        className="p-1.5 rounded-lg text-gray-500 hover:text-[#262A2E] hover:bg-gray-100 cursor-pointer"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {isListening && interimText && (
        <div className="absolute left-0 bottom-full mb-1 z-50 bg-[#262A2E] text-white text-[11px] px-3 py-1.5 rounded-lg shadow-lg border border-gray-700 whitespace-nowrap max-w-xs truncate animate-fade-in">
          <span className="text-[#FFC20E] font-bold mr-1">Mic:</span>
          {interimText}
        </div>
      )}

      {showQuickPhrases && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-2 space-y-1 animate-fade-in">
          <div className="px-2 py-1 flex items-center justify-between border-b border-gray-100 text-[10px] font-bold text-gray-500 font-mono uppercase tracking-wider">
            <span>Quick Shop-Floor Phrases</span>
            <Sparkles className="w-3 h-3 text-[#FFC20E]" />
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
                className="w-full text-left text-xs p-2 rounded-lg hover:bg-[#FFFBEB] text-[#262A2E] transition-colors cursor-pointer leading-snug"
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
