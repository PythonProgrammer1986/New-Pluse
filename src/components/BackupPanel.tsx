import React, { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface BackupPanelProps {
  onExport: () => void;
  onImport: (jsonString: string) => boolean;
  onReset: () => void;
  onLoadLinkedOperations?: () => Promise<boolean>;
}

export default function BackupPanel({
  onExport,
  onImport,
  onReset,
  onLoadLinkedOperations,
}: BackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = onImport(text);
      if (success) {
        setImportStatus('success');
        setStatusMessage('All board metrics, 5-Why root cause sheets, and action items have been restored.');
        setTimeout(() => setImportStatus('idle'), 4000);
      } else {
        setImportStatus('error');
        setStatusMessage('Invalid file structure. Make sure you are uploading a valid Huddleboard JSON backup.');
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setStatusMessage('Failed to read backup file.');
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
      <div>
        <h3 className="font-bold text-[#262A2E] text-sm flex items-center gap-2">
          <Download className="w-4 h-4 text-[#262A2E]" />
          Huddleboard Backup & Dataset Sync
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Save, restore, or load your team configuration and operational huddleboard state.
        </p>
      </div>

      {/* Linked Operations Dataset 1-Click Sync */}
      {onLoadLinkedOperations && (
        <div className="bg-[#FFFBEB] border border-[#FFC20E]/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <FileText className="w-5 h-5 text-[#262A2E] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#262A2E] block">
                Linked Operations Dataset Ready
              </span>
              <span className="text-[11px] text-gray-600 block mt-0.5 leading-relaxed">
                Contains live projects (SmartROC T45, ST1030, RC 30, Boomer M2D), production tasks, employee rosters &amp; hour bookings.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = await onLoadLinkedOperations();
              if (ok) {
                setImportStatus('success');
                setStatusMessage('Linked Operations Dataset loaded into workspace.');
                setTimeout(() => setImportStatus('idle'), 4000);
              } else {
                setImportStatus('error');
                setStatusMessage('Could not load linked operational dataset.');
              }
            }}
            className="px-4 py-2 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-bold text-xs rounded-lg shadow-xs shrink-0 cursor-pointer transition-colors"
          >
            Load Operations Data
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="flex flex-col items-center justify-center p-4 bg-[#F7F8F9] border border-gray-200 hover:border-[#FFC20E] hover:bg-[#FFFBEB] rounded-xl text-center group transition-all cursor-pointer"
        >
          <Download className="w-5 h-5 text-[#262A2E] mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-[#262A2E]">Export Backup</span>
          <span className="text-[10px] text-gray-500 mt-1">Download state .json</span>
        </button>

        {/* Import Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-[#F7F8F9] border border-gray-200 hover:border-[#FFC20E] hover:bg-[#FFFBEB] rounded-xl text-center group transition-all cursor-pointer"
        >
          <Upload className="w-5 h-5 text-[#262A2E] mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-[#262A2E]">Import Restore</span>
          <span className="text-[10px] text-gray-500 mt-1">Upload state .json</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Reset Template Button */}
        <button
          type="button"
          onClick={onReset}
          className="flex flex-col items-center justify-center p-4 bg-[#F7F8F9] border border-gray-200 hover:border-rose-400 hover:bg-rose-50/40 rounded-xl text-center group transition-all cursor-pointer"
        >
          <RefreshCw className="w-5 h-5 text-rose-600 mb-2 group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold text-[#262A2E]">Reset Template</span>
          <span className="text-[10px] text-gray-500 mt-1">Restore default seed</span>
        </button>
      </div>

      {/* Notifications */}
      {importStatus === 'success' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <span className="font-bold block">Sync Complete</span>
            <span className="text-[11px] mt-0.5 block">{statusMessage}</span>
          </div>
        </div>
      )}

      {importStatus === 'error' && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800 animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold block">Action Failed</span>
            <span className="text-[11px] mt-0.5 block">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
