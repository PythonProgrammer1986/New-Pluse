import React, { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface BackupPanelProps {
  onExport: () => void;
  onImport: (jsonString: string) => boolean;
  onReset: () => void;
}

export default function BackupPanel({
  onExport,
  onImport,
  onReset,
}: BackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = onImport(text);
      if (success) {
        setImportStatus('success');
        setErrorMessage('');
        setTimeout(() => setImportStatus('idle'), 4000);
      } else {
        setImportStatus('error');
        setErrorMessage('Invalid file structure. Make sure you are uploading a valid Huddleboard JSON backup.');
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setErrorMessage('Failed to read backup file.');
    };
    reader.readAsText(file);
    
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          Huddleboard Backup Facility
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Save, backup, and restore your full team configuration and huddleboard metrics instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 rounded-xl text-center group transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Backup</span>
          <span className="text-[9px] text-slate-400 mt-1">Download state .json</span>
        </button>

        {/* Import Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 rounded-xl text-center group transition-all cursor-pointer shadow-sm"
        >
          <Upload className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Import Restore</span>
          <span className="text-[9px] text-slate-400 mt-1">Upload state .json</span>
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
          onClick={onReset}
          className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-600 hover:bg-rose-50/10 dark:hover:bg-rose-950/10 rounded-xl text-center group transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-5 h-5 text-rose-600 mb-2 group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Reset Template</span>
          <span className="text-[9px] text-slate-400 mt-1">Restore default seed</span>
        </button>
      </div>

      {/* Notifications */}
      {importStatus === 'success' && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-400 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Backup Successfully Restored</span>
            <span className="text-[10px] mt-0.5 block leading-relaxed">
              All team board metrics, 5-Why root cause sheets, and action items have been overwritten and synchronized with the backup file.
            </span>
          </div>
        </div>
      )}

      {importStatus === 'error' && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2 text-xs text-rose-800 dark:text-rose-400 animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Failed to Restore Backup</span>
            <span className="text-[10px] mt-0.5 block leading-relaxed">{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
