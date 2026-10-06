import * as XLSX from 'xlsx';
import { ExcelSyncRule, MetricWidget, DataPoint } from '../types';

/**
 * Reads an uploaded Excel (.xlsx, .xls) or CSV file and returns the XLSX Workbook
 */
export async function parseExcelWorkbook(file: File): Promise<XLSX.WorkBook> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  return workbook;
}

/**
 * Converts column letter like "A", "B", "Z", "AA" into 0-indexed column integer
 */
export function columnLetterToIdx(colStr: string): number {
  if (!colStr) return 0;
  const clean = colStr.trim().toUpperCase();
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    sum = sum * 26 + (clean.charCodeAt(i) - 64);
  }
  return Math.max(0, sum - 1);
}

/**
 * Converts 0-indexed integer into column letter like 0 -> "A", 1 -> "B", 25 -> "Z", 26 -> "AA"
 */
export function idxToColumnLetter(idx: number): string {
  let temp = idx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter || 'A';
}

/**
 * Robustly checks if an Excel cell value matches a target JavaScript Date
 */
export function isSameExcelDate(cellVal: any, searchDate: Date): boolean {
  if (cellVal === undefined || cellVal === null || cellVal === '') return false;

  const targetYear = searchDate.getFullYear();
  const targetMonth = searchDate.getMonth(); // 0-based
  const targetDay = searchDate.getDate();

  // 1. If cellVal is JS Date object
  if (cellVal instanceof Date) {
    return (
      cellVal.getFullYear() === targetYear &&
      cellVal.getMonth() === targetMonth &&
      cellVal.getDate() === targetDay
    );
  }

  // 2. If cellVal is Excel Serial Number (e.g. 45000+)
  if (typeof cellVal === 'number' && cellVal > 30000 && cellVal < 70000) {
    const jsDate = new Date((cellVal - (25567 + 2)) * 86400 * 1000);
    return (
      jsDate.getFullYear() === targetYear &&
      jsDate.getMonth() === targetMonth &&
      jsDate.getDate() === targetDay
    );
  }

  const str = String(cellVal).trim();
  if (!str) return false;

  // 3. Exact ISO check: "2026-10-06"
  const isoSearch = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  if (str.includes(isoSearch)) return true;

  // 4. Try parsing string with Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return (
      parsed.getFullYear() === targetYear &&
      parsed.getMonth() === targetMonth &&
      parsed.getDate() === targetDay
    );
  }

  // 5. Fallback regex match for "6/10" or "10/6" or "06-10" or "6-Oct"
  const dayStr = String(targetDay);
  const monthStr = String(targetMonth + 1);
  if (str.includes(dayStr) && str.includes(monthStr)) return true;

  return false;
}

/**
 * Fuzzy matches an Excel header string against a Metric Widget Title
 */
export function matchHeaderToWidgetTitle(headerStr: string, widgetTitle: string): boolean {
  if (!headerStr || !widgetTitle) return false;
  const cleanHeader = headerStr.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = widgetTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanHeader === cleanTitle) return true;
  if (cleanHeader.length > 3 && cleanTitle.length > 3) {
    return cleanHeader.includes(cleanTitle) || cleanTitle.includes(cleanHeader);
  }
  return false;
}

/**
 * Auto-detects the DATE column (Column 1) and KPI column matching widgetTitle in Row 1 headers
 */
export function autoDetectKPIColumn(
  data: any[][],
  widgetTitle: string
): { dateColIdx: number; valColIdx: number; matchedHeader: string } | null {
  if (!data || data.length === 0) return null;

  let dateColIdx = 0; // Column 1 by default (0-indexed A)
  let headerRowIdx = 0; // Row 1 headers by default

  // Scan first 3 rows for Date column header
  for (let r = 0; r < Math.min(3, data.length); r++) {
    const row = data[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      if (/^date$/i.test(cellVal) || /^dt$/i.test(cellVal) || /^day$/i.test(cellVal) || /^timestamp$/i.test(cellVal)) {
        dateColIdx = c;
        headerRowIdx = r;
      }
    }
  }

  // Scan header row for column matching widget title
  const headerRow = data[headerRowIdx] || data[0];
  for (let c = 0; c < headerRow.length; c++) {
    const cellVal = String(headerRow[c] || '').trim();
    if (cellVal && matchHeaderToWidgetTitle(cellVal, widgetTitle)) {
      return {
        dateColIdx,
        valColIdx: c,
        matchedHeader: cellVal
      };
    }
  }

  return null;
}

/**
 * Extracts all historical date rows for a KPI column to build a Trend Series
 */
export function extractTrendSeriesForWidget(
  data: any[][],
  dateColIdx: number,
  valColIdx: number,
  targetVal?: number
): DataPoint[] {
  const trendPoints: DataPoint[] = [];

  // Start after header row (row 1 / index 1)
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row[dateColIdx] === undefined || row[valColIdx] === undefined) continue;

    const rawDate = row[dateColIdx];
    const rawVal = row[valColIdx];

    if (rawDate === undefined || rawDate === null) continue;

    let parsedVal = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
    if (isNaN(parsedVal)) continue;

    // Format clean date label (e.g., "10-06")
    let label = String(rawDate).trim();
    if (rawDate instanceof Date) {
      label = `${String(rawDate.getMonth() + 1).padStart(2, '0')}-${String(rawDate.getDate()).padStart(2, '0')}`;
    } else if (label.includes('T')) {
      label = label.split('T')[0].substring(5);
    } else {
      const dObj = new Date(label);
      if (!isNaN(dObj.getTime())) {
        label = `${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
      }
    }

    trendPoints.push({
      label,
      value: parsedVal,
      target: targetVal
    });
  }

  return trendPoints;
}

/**
 * Extracts numeric value from Excel sheet where Rows = Dates (Col 1 = DATE) and Col 2..N = KPIs
 */
export function extractValueByRule(
  workbook: XLSX.WorkBook,
  rule: ExcelSyncRule,
  widgetTitle?: string,
  targetDateStr?: string
): { value: number | null; trend: DataPoint[]; matchedCol?: string; matchedDateRow?: string } {
  try {
    const sheetName = rule.sheetName && workbook.SheetNames.includes(rule.sheetName)
      ? rule.sheetName
      : workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return { value: null, trend: [] };

    // Convert sheet to 2D array [row][col]
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
    if (!data || data.length === 0) return { value: null, trend: [] };

    let dateColIdx = columnLetterToIdx(rule.dateColumn || 'A');
    let valColIdx = columnLetterToIdx(rule.valueColumn || 'B');
    let matchedHeader = '';

    // 1. Auto-detect by KPI Title matching header row if widgetTitle is provided
    if (widgetTitle) {
      const autoMatch = autoDetectKPIColumn(data, widgetTitle);
      if (autoMatch) {
        dateColIdx = autoMatch.dateColIdx;
        valColIdx = autoMatch.valColIdx;
        matchedHeader = autoMatch.matchedHeader;
      }
    }

    // 2. Extract trend series across ALL date rows (Rows 2..N)
    const trend = extractTrendSeriesForWidget(data, dateColIdx, valColIdx);

    // Fixed cell mode
    if (rule.mode === 'fixed_cell') {
      const coord = (rule.cellCoordinate || 'B2').toUpperCase().trim();
      const cell = sheet[coord];
      if (!cell) return { value: null, trend };
      const parsed = parseFloat(cell.v);
      return { value: isNaN(parsed) ? null : parsed, trend, matchedCol: idxToColumnLetter(valColIdx) };
    }

    // 3. Date Lookup Mode (Default & Standard Excel Layout: Row = Date, Col = KPI)
    const searchDate = targetDateStr ? new Date(targetDateStr) : new Date();
    let extractedValue: number | null = null;
    let matchedDateRowStr = '';

    // Scan date rows starting at Row 1 (index 1)
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!row || row[dateColIdx] === undefined) continue;

      const cellDateVal = row[dateColIdx];
      if (isSameExcelDate(cellDateVal, searchDate)) {
        if (row[valColIdx] !== undefined) {
          const rawVal = row[valColIdx];
          const parsed = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
          if (!isNaN(parsed)) {
            extractedValue = parsed;
            matchedDateRowStr = String(cellDateVal);
            break;
          }
        }
      }
    }

    // Fallback: If selected date row was not found (e.g. today's date isn't in file yet),
    // extract value from the LAST available date row in the file!
    if (extractedValue === null && data.length > 1) {
      for (let r = data.length - 1; r >= 1; r--) {
        const row = data[r];
        if (row && row[valColIdx] !== undefined) {
          const rawVal = row[valColIdx];
          const parsed = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
          if (!isNaN(parsed)) {
            extractedValue = parsed;
            matchedDateRowStr = `${row[dateColIdx]} (Latest Row)`;
            break;
          }
        }
      }
    }

    return {
      value: extractedValue,
      trend,
      matchedCol: idxToColumnLetter(valColIdx),
      matchedDateRow: matchedDateRowStr
    };

  } catch (err) {
    console.error('Error evaluating Excel rule:', err);
  }

  return { value: null, trend: [] };
}

/**
 * Downloads a sample pre-formatted Daily Shift Log Excel workbook (.xlsx)
 * with DATE in 1st Column and KPI Titles in 2nd Column onwards.
 */
export function downloadSampleExcelWorkbook() {
  const headers = [
    'DATE', 
    'Days Since Last LTI', 
    'Daily Hazards Identified', 
    'Daily Energy Consumption', 
    'Daily Defect Pareto Log', 
    'Takt-Time Pace Pulse',
    'CO2 Footprint Index'
  ];
  const rows: any[][] = [headers];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Populate 31 days (Rows = Dates, Columns = KPIs)
  for (let d = 1; d <= 31; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const lti = 140 + d;
    const hazards = Math.floor(Math.random() * 2);
    const energyKwh = Math.round(390 + Math.random() * 45);
    const defects = Math.floor(Math.random() * 6);
    const taktPace = Math.round(78 + Math.random() * 8);
    const co2Index = Math.round(110 + Math.random() * 25);

    rows.push([dStr, lti, hazards, energyKwh, defects, taktPace, co2Index]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Shift Log');

  XLSX.writeFile(workbook, `EPS_Daily_Shift_Log_RowsAsDates_${year}-${month + 1}.xlsx`);
}
