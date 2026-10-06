import React, { useState } from 'react';
import { MetricWidget, ExcelSyncRule, DataPoint } from '../types';
import { 
  parseExcelWorkbook, extractValueByRule, downloadSampleExcelWorkbook 
} from '../utils/excelHelper';
import { 
  FileSpreadsheet, Upload, Download, Check, AlertTriangle, 
  HelpCircle, RefreshCw, X, Table, ArrowRight, Settings, TrendingUp 
} from 'lucide-react';

interface ExcelSyncModalProps {
  widgets: MetricWidget[];
  onUpdateWidgetValue: (id: string, updates: Partial<MetricWidget>) => void;
  onClose: () => void;
}

export default function ExcelSyncModal({
  widgets,
  onUpdateWidgetValue,
  onClose
}: ExcelSyncModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<any | null>(null);
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveTrendSeries, setSaveTrendSeries] = useState(true);

  const [parsedResults, setParsedResults] = useState<Array<{
    widget: MetricWidget;
    extractedValue: number | null;
    trend: DataPoint[];
    matchedCol?: string;
    rule: ExcelSyncRule;
  }>>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Handle File Upload and Parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setIsProcessing(true);
    setSyncSuccessMsg(null);

    try {
      const wb = await parseExcelWorkbook(uploadedFile);
      setWorkbook(wb);
      evaluateAllWidgets(wb, targetDate);
    } catch (err) {
      alert('Error reading Excel file. Please ensure it is a valid .xlsx, .xls, or .csv workbook.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-evaluate values whenever target date changes
  const evaluateAllWidgets = (wb: any, dateStr: string) => {
    if (!wb) return;
    const results = widgets.map((w) => {
      const rule: ExcelSyncRule = w.excelRule || {
        mode: 'date_lookup',
        dateColumn: 'A',
        valueColumn: 'B',
        headerOffset: 1
      };

      // Pass widget.title for automatic KPI Column Header matching
      const result = extractValueByRule(wb, rule, w.title, dateStr);
      
      // If matched column was auto-detected, reflect it in the rule valueColumn
      const updatedRule: ExcelSyncRule = {
        ...rule,
        ...(result.matchedCol ? { valueColumn: result.matchedCol } : {})
      };

      return {
        widget: w,
        extractedValue: result.value,
        trend: result.trend,
        matchedCol: result.matchedCol,
        rule: updatedRule
      };
    });

    setParsedResults(results);
  };

  const handleDateChange = (newDate: string) => {
    setTargetDate(newDate);
    if (workbook) {
      evaluateAllWidgets(workbook, newDate);
    }
  };

  // Update rule for a specific widget inline inside the modal
  const handleRuleChange = (widgetId: string, updates: Partial<ExcelSyncRule>) => {
    const nextResults = parsedResults.map((item) => {
      if (item.widget.id === widgetId) {
        const newRule: ExcelSyncRule = { ...item.rule, ...updates };
        const result = workbook ? extractValueByRule(workbook, newRule, item.widget.title, targetDate) : { value: item.extractedValue, trend: item.trend };
        
        onUpdateWidgetValue(widgetId, { excelRule: newRule });
        
        return {
          ...item,
          rule: newRule,
          extractedValue: result.value,
          trend: result.trend,
          matchedCol: result.matchedCol
        };
      }
      return item;
    });

    setParsedResults(nextResults);
  };

  // Commit Extracted Excel Values and Historical Trends to KPIs
  const handleApplySync = () => {
    let count = 0;
    parsedResults.forEach(({ widget, extractedValue, trend, rule }) => {
      if (extractedValue !== null && !isNaN(extractedValue)) {
        onUpdateWidgetValue(widget.id, {
          actual: extractedValue,
          excelRule: rule,
          ...(saveTrendSeries && trend && trend.length > 0 ? { dataPoints: trend } : {}),
          state: (widget.target !== undefined && extractedValue < widget.target) ? 'red' : 'green'
        });
        count++;
      }
    });

    setSyncSuccessMsg(`Successfully synced ${count} metric KPIs and updated historical trend series!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#FFC20E] shrink-0" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Excel Dynamic KPI & Trend Importer</h3>
              <span className="text-[10px] text-slate-400 font-mono">1st Column = DATE · KPI Headers match Widget Titles</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-lg focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Top Actions: Upload File & Download Sample Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#FFC20E] bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center space-y-2 transition-all">
              <Upload className="w-6 h-6 text-[#FFC20E] mx-auto" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {file ? file.name : 'Upload Daily Excel Sheet (.xlsx, .csv)'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  1st Col = DATE. Remaining columns match KPI Titles to fetch data.
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 text-xs font-black rounded-lg cursor-pointer font-mono shadow-sm transition-all">
                <span>Select Excel File</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Download Sample Zone */}
            <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Download Matching Excel Template</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Download a pre-formatted Excel workbook matching your board's exact Widget Titles with a 31-day DATE column.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleExcelWorkbook}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer font-mono flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#FFC20E]" />
                <span>Download Sample .xlsx</span>
              </button>
            </div>

          </div>

          {/* Sync Target Date & Trend Mapping Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#FFC20E]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Target Date to Extract:
              </span>
              <input 
                type="date" 
                value={targetDate} 
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs font-mono font-bold px-3 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FFC20E]"
              />
            </div>

            {/* Trend Mapping Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveTrendSeries}
                onChange={(e) => setSaveTrendSeries(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Map & Save Full Historical Trend Series (`dataPoints`)
              </span>
            </label>
          </div>

          {/* Notification Message */}
          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{syncSuccessMsg}</span>
              </div>
              <button onClick={() => setSyncSuccessMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>
          )}

          {/* Extracted Values Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                Auto-Matched Header & Cell Extraction Results ({parsedResults.length} Widgets)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {file ? 'Automatic KPI Title Header Matching Active' : 'Upload file to match headers'}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white text-[9px] font-mono uppercase tracking-wider">
                    <th className="p-3">Widget KPI Title</th>
                    <th className="p-3">Matched Excel Column</th>
                    <th className="p-3 text-center">Extracted Value ({targetDate})</th>
                    <th className="p-3 text-center">Historical Trend Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {parsedResults.map(({ widget, extractedValue, trend, matchedCol, rule }) => (
                    <tr key={widget.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                      
                      {/* Metric Name */}
                      <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={widget.title}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FFC20E]"></span>
                          <span>{widget.title}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block uppercase">{widget.pillar} · {widget.level}</span>
                      </td>

                      {/* Matched Column Config */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Col:</span>
                          <input
                            type="text"
                            value={rule.valueColumn || matchedCol || 'B'}
                            onChange={(e) => handleRuleChange(widget.id, { valueColumn: e.target.value.toUpperCase() })}
                            className="w-12 text-center text-xs px-1 py-0.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded font-mono font-bold"
                          />
                          {matchedCol && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold rounded">
                              ✓ Auto-Matched Header
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Extracted Value Result */}
                      <td className="p-3 text-center font-mono font-extrabold text-sm">
                        {extractedValue !== null ? (
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {extractedValue} {widget.unit || ''}
                          </span>
                        ) : file ? (
                          <span className="text-rose-500 text-[10px] font-mono">No Date Match</span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Awaiting File</span>
                        )}
                      </td>

                      {/* Historical Trend Series Count */}
                      <td className="p-3 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {trend && trend.length > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                            📈 {trend.length} Dates Loaded
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">--</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-400 font-mono">
            {parsedResults.filter(p => p.extractedValue !== null).length} of {parsedResults.length} metrics matched
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file || parsedResults.every(p => p.extractedValue === null)}
              onClick={handleApplySync}
              className={`px-4 py-2 text-xs font-black rounded-lg font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                file && parsedResults.some(p => p.extractedValue !== null)
                  ? 'bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950'
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Apply & Save KPI Values + Trend Charts</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
