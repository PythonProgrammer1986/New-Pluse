import React, { useState } from 'react';
import { MetricWidget, ExcelSyncRule, DataPoint } from '../types';
import {
  parseExcelWorkbook, extractValueByRule, downloadSampleExcelWorkbook
} from '../utils/excelHelper';
import {
  FileSpreadsheet, Upload, Download, Check, AlertTriangle,
  RefreshCw, X, Table, TrendingUp
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

  const [parsedResults, setParsedResults] = useState<
    Array<{
      widget: MetricWidget;
      extractedValue: number | null;
      trend: DataPoint[];
      matchedCol?: string;
      rule: ExcelSyncRule;
    }>
  >([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setIsProcessing(true);
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);

    try {
      const wb = await parseExcelWorkbook(uploadedFile);
      setWorkbook(wb);
      evaluateAllWidgets(wb, targetDate);
    } catch {
      setSyncErrorMsg('Could not read file. Please upload a valid .xlsx, .xls, or .csv workbook.');
    } finally {
      setIsProcessing(false);
    }
  };

  const evaluateAllWidgets = (wb: any, dateStr: string) => {
    if (!wb) return;
    const results = widgets.map((w) => {
      const rule: ExcelSyncRule = w.excelRule || {
        mode: 'date_lookup',
        dateColumn: 'A',
        valueColumn: 'B',
        headerOffset: 1
      };

      const result = extractValueByRule(wb, rule, w.title, dateStr);
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

  const handleRuleChange = (widgetId: string, updates: Partial<ExcelSyncRule>) => {
    const nextResults = parsedResults.map((item) => {
      if (item.widget.id === widgetId) {
        const newRule: ExcelSyncRule = { ...item.rule, ...updates };
        const result = workbook
          ? extractValueByRule(workbook, newRule, item.widget.title, targetDate)
          : { value: item.extractedValue, trend: item.trend, matchedCol: item.matchedCol };

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

  const handleApplySync = () => {
    let count = 0;
    parsedResults.forEach(({ widget, extractedValue, trend, rule }) => {
      if (extractedValue !== null && !isNaN(extractedValue)) {
        // Omit state so useAppState.updateWidgetValue applies computeMetricState (supporting inverse KPIs)
        onUpdateWidgetValue(widget.id, {
          actual: extractedValue,
          excelRule: rule,
          ...(saveTrendSeries && trend && trend.length > 0 ? { dataPoints: trend } : {})
        });
        count++;
      }
    });

    setSyncSuccessMsg(`Synced ${count} KPI metrics and updated historical trends.`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F7F8F9] border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFC20E] text-[#1F2328] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#262A2E]">
                Excel Dynamic KPI & Trend Importer
              </h3>
              <span className="text-[10px] text-[#6B7280] font-mono">
                Column A = DATE · Remaining columns auto-match Widget Titles
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#262A2E] hover:bg-gray-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-gray-300 hover:border-[#FFC20E] bg-[#F7F8F9] p-4 rounded-xl text-center space-y-2 transition-colors">
              <Upload className="w-6 h-6 text-[#D97706] mx-auto" />
              <div>
                <span className="text-xs font-bold text-[#262A2E] block">
                  {file ? file.name : 'Upload Daily Excel Sheet (.xlsx, .csv)'}
                </span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">
                  {isProcessing ? 'Parsing workbook...' : 'Matches DATE column and KPI headers automatically.'}
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-lg cursor-pointer font-mono transition-colors">
                <span>Select Excel File</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Download Sample */}
            <div className="border border-gray-200 bg-[#F7F8F9] p-4 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#262A2E]">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Matching Excel Template</span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1 leading-relaxed">
                  Download a pre-formatted Excel workbook matching your board&apos;s exact widget titles with a 31-day DATE column.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleExcelWorkbook}
                className="w-full py-2 bg-[#262A2E] hover:bg-[#3A3F45] text-white text-xs font-bold rounded-lg cursor-pointer font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#FFC20E]" />
                <span>Download Sample .xlsx</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F8F9] border border-gray-200 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#D97706]" />
              <span className="text-xs font-bold text-[#262A2E]">Target Date:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs font-mono font-bold px-3 py-1 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveTrendSeries}
                onChange={(e) => setSaveTrendSeries(e.target.checked)}
                className="w-4 h-4 accent-[#FFC20E] rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#3A3F45] font-mono flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Save Historical Trend Series
              </span>
            </label>
          </div>

          {syncErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{syncErrorMsg}</span>
              </div>
              <button type="button" onClick={() => setSyncErrorMsg(null)} className="text-rose-500 cursor-pointer">
                &times;
              </button>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{syncSuccessMsg}</span>
              </div>
              <button type="button" onClick={() => setSyncSuccessMsg(null)} className="text-emerald-600 cursor-pointer">
                &times;
              </button>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#4B5563] font-mono">
                Header & Cell Extraction Preview ({parsedResults.length} Widgets)
              </h4>
              <span className="text-[10px] text-[#6B7280] font-mono">
                {file ? 'Auto-Matched Header Mapping Active' : 'Upload file to preview'}
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F8F9] text-[#4B5563] text-[10px] font-mono font-bold uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3">Widget KPI Title</th>
                    <th className="p-3">Matched Excel Column</th>
                    <th className="p-3 text-center">Extracted Value ({targetDate})</th>
                    <th className="p-3 text-center">Trend Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {parsedResults.map(({ widget, extractedValue, trend, matchedCol, rule }) => (
                    <tr key={widget.id} className="hover:bg-[#F7F8F9] transition-colors">
                      <td className="p-3 font-bold text-[#262A2E] max-w-[200px] truncate" title={widget.title}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FFC20E] shrink-0"></span>
                          <span className="truncate">{widget.title}</span>
                        </div>
                        <span className="text-[9px] text-[#6B7280] font-mono block uppercase">
                          {widget.pillar} · {widget.level}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-[#6B7280] uppercase">Col:</span>
                          <input
                            type="text"
                            value={rule.valueColumn || matchedCol || 'B'}
                            onChange={(e) => handleRuleChange(widget.id, { valueColumn: e.target.value.toUpperCase() })}
                            className="w-12 text-center text-xs px-1 py-0.5 border border-gray-300 bg-white text-[#262A2E] rounded font-mono font-bold focus:ring-2 focus:ring-[#FFC20E] focus:outline-none"
                          />
                          {matchedCol && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold rounded">
                              Matched
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-sm">
                        {extractedValue !== null ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {extractedValue} {widget.unit || ''}
                          </span>
                        ) : file ? (
                          <span className="text-rose-600 text-[10px] font-mono">No Date Match</span>
                        ) : (
                          <span className="text-[#9CA3AF] text-[10px] italic">Awaiting File</span>
                        )}
                      </td>

                      <td className="p-3 text-center font-mono text-xs font-semibold text-[#3A3F45]">
                        {trend && trend.length > 0 ? (
                          <span className="text-[#1F2328] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FFC20E]/50 font-mono">
                            {trend.length} Dates
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] text-[10px]">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F7F8F9] border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-[#6B7280] font-mono">
            {parsedResults.filter(p => p.extractedValue !== null).length} of {parsedResults.length} metrics matched
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#3A3F45] bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-bold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!file || parsedResults.every(p => p.extractedValue === null)}
              onClick={handleApplySync}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                file && parsedResults.some(p => p.extractedValue !== null)
                  ? 'bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328]'
                  : 'bg-gray-200 text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Apply & Save Values</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
