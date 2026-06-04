// src/components/PerformanceTables.jsx
import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  Download,
  Copy,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ExcelGridView: Dynamic Excel-style spreadsheet component
function ExcelGridView({ data, columns, fileName = "Janganana_Excel_Export" }) {
  const [gridData, setGridData] = useState(() => data);
  const [activeCell, setActiveCell] = useState({ rowIndex: 0, colIndex: 0 });
  const [formulaValue, setFormulaValue] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [gridlines, setGridlines] = useState(true);
  const [headerTheme, setHeaderTheme] = useState('excel-green'); // excel-green, classic-steel, gov-blue
  const [boldText, setBoldText] = useState(false);
  const [italicText, setItalicText] = useState(false);
  const [textAlign, setTextAlign] = useState('left'); // left, center, right

  // Sync gridData when data changes
  React.useEffect(() => {
    setGridData(data);
    if (data.length > 0) {
      setActiveCell({ rowIndex: 0, colIndex: 0 });
      setFormulaValue(String(data[0][columns[0].key] || ''));
    }
  }, [data]);

  // Handle cell click
  const handleCellClick = (rowIdx, colIdx) => {
    setActiveCell({ rowIndex: rowIdx, colIndex: colIdx });
    const val = gridData[rowIdx] ? gridData[rowIdx][columns[colIdx].key] : '';
    setFormulaValue(String(val || ''));
  };

  // Handle active cell value change from the formula bar
  const handleValueChange = (newVal) => {
    setFormulaValue(newVal);
    setGridData(prev => {
      const copy = [...prev];
      if (copy[activeCell.rowIndex]) {
        const item = { ...copy[activeCell.rowIndex] };
        const key = columns[activeCell.colIndex].key;
        
        // Match numbers if the column is expected to be numeric
        const isNumeric = columns[activeCell.colIndex].numeric || typeof data[activeCell.rowIndex][key] === 'number';
        item[key] = isNumeric ? (Number(newVal) || 0) : newVal;
        
        copy[activeCell.rowIndex] = item;
      }
      return copy;
    });
  };

  // Calculate quick stats on current gridData
  const getStats = () => {
    let count = gridData.length;
    let sumExpected = 0;
    
    gridData.forEach(item => {
      sumExpected += Number(item.expectedHouses) || 0;
    });
    
    let avgExpected = count > 0 ? Math.round(sumExpected / count) : 0;
    
    return { count, sumExpected, avgExpected };
  };

  const { count, sumExpected, avgExpected } = getStats();

  // Export handlers
  const handleExportXlsx = () => {
    setShowExportMenu(false);
    const exportRows = gridData.map(item => {
      const row = {};
      columns.forEach(col => {
        row[col.label] = item[col.key];
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleExportCsv = () => {
    setShowExportMenu(false);
    const exportRows = gridData.map(item => {
      const row = {};
      columns.forEach(col => {
        row[col.label] = item[col.key];
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    setShowExportMenu(false);
    const jsonStr = JSON.stringify(gridData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${fileName}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTsv = () => {
    setShowExportMenu(false);
    const headers = columns.map(c => c.label).join('\t');
    const rows = gridData.map(item => 
      columns.map(c => item[c.key]).join('\t')
    ).join('\n');
    const tsv = `${headers}\n${rows}`;
    navigator.clipboard.writeText(tsv);
    alert('Spreadsheet data copied to clipboard as TSV format! You can paste it directly into MS Excel.');
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  const activeCellAddress = columns[activeCell.colIndex] 
    ? `${columns[activeCell.colIndex].letter}${activeCell.rowIndex + 1}` 
    : '';

  // Theme colors mapping
  const headerThemeClasses = {
    'excel-green': 'bg-emerald-700 text-white dark:bg-emerald-900 border-emerald-600',
    'classic-steel': 'bg-slate-700 text-white dark:bg-slate-800 border-slate-600',
    'gov-blue': 'bg-gov-800 text-white dark:bg-gov-950 border-gov-700'
  };

  return (
    <div className="flex flex-col border border-slate-200 bg-white rounded-xl shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden font-mono text-xs select-none">
      
      {/* 1. SpreadSheet Menu Header Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-[10px] text-slate-500 font-sans">
        <div className="flex gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Janganana_Progress_Sheet.xlsx</span>
          <span className="hover:text-slate-800 cursor-pointer">File</span>
          <span className="hover:text-slate-800 cursor-pointer">Edit</span>
          <span className="hover:text-slate-800 cursor-pointer">View</span>
          <span className="hover:text-slate-800 cursor-pointer">Format</span>
          <span className="hover:text-slate-800 cursor-pointer">Data</span>
          <span className="hover:text-slate-800 cursor-pointer text-emerald-600 font-bold dark:text-emerald-400">Excel Mode Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Linked Local Data</span>
        </div>
      </div>

      {/* 2. SpreadSheet Toolbar Bar */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-100/80 border-b border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 font-sans text-slate-700 dark:text-slate-350">
        
        {/* Export Center Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 transition text-[11px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Sheet</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showExportMenu && (
            <div className="absolute left-0 mt-1 w-52 rounded border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-850 dark:bg-slate-950 z-20 font-sans text-[11px]">
              <button 
                onClick={handleExportXlsx} 
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Export to Excel (.xlsx)</span>
              </button>
              <button 
                onClick={handleExportCsv} 
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Export to CSV (.csv)</span>
              </button>
              <button 
                onClick={handleExportJson} 
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <span className="text-amber-500 font-bold font-mono">{"{}"}</span>
                <span>Export to JSON (.json)</span>
              </button>
              <button 
                onClick={handleCopyTsv} 
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-900 border-t border-slate-100 dark:border-slate-900 mt-1 pt-1.5"
              >
                <Copy className="h-3.5 w-3.5 text-indigo-500" />
                <span>Copy TSV to Clipboard</span>
              </button>
              <button 
                onClick={handlePrint} 
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print Grid View</span>
              </button>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700"></div>

        {/* Text styling simulation */}
        <div className="flex rounded border border-slate-350 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden text-[10px]">
          <button 
            onClick={() => setBoldText(!boldText)} 
            className={`px-2 py-1 border-r border-slate-300 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 ${boldText ? 'bg-slate-200 dark:bg-slate-800' : ''}`}
            title="Toggle Bold Font"
          >
            B
          </button>
          <button 
            onClick={() => setItalicText(!italicText)} 
            className={`px-2.5 py-1 italic hover:bg-slate-100 dark:hover:bg-slate-900 ${italicText ? 'bg-slate-200 dark:bg-slate-800' : ''}`}
            title="Toggle Italic Font"
          >
            I
          </button>
        </div>

        {/* Alignment */}
        <div className="flex rounded border border-slate-355 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden text-[10px]">
          <button onClick={() => setTextAlign('left')} className={`px-2 py-1 border-r border-slate-300 dark:border-slate-800 hover:bg-slate-100 ${textAlign === 'left' ? 'bg-slate-200 dark:bg-slate-800' : ''}`}>L</button>
          <button onClick={() => setTextAlign('center')} className={`px-2 py-1 border-r border-slate-300 dark:border-slate-800 hover:bg-slate-100 ${textAlign === 'center' ? 'bg-slate-200 dark:bg-slate-800' : ''}`}>C</button>
          <button onClick={() => setTextAlign('right')} className={`px-2 py-1 hover:bg-slate-100 ${textAlign === 'right' ? 'bg-slate-200 dark:bg-slate-800' : ''}`}>R</button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700"></div>

        {/* Gridlines option */}
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:text-slate-950 dark:hover:text-white">
          <input 
            type="checkbox" 
            checked={gridlines} 
            onChange={(e) => setGridlines(e.target.checked)} 
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
          />
          <span>Gridlines</span>
        </label>

        {/* Gutter color themes */}
        <div className="flex items-center gap-1 text-[11px] ml-auto">
          <span>Theme:</span>
          <select 
            value={headerTheme} 
            onChange={(e) => setHeaderTheme(e.target.value)} 
            className="rounded border border-slate-300 bg-white py-0.5 px-1.5 text-[10px] outline-none dark:bg-slate-950 dark:border-slate-800"
          >
            <option value="excel-green">Excel Green</option>
            <option value="classic-steel">Classic Steel</option>
            <option value="gov-blue">Gov Blue</option>
          </select>
        </div>
      </div>

      {/* 3. SpreadSheet Formula Bar */}
      <div className="flex items-center border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-300">
        
        {/* Active cell address box */}
        <div className="flex items-center justify-center min-w-[50px] px-2 py-1.5 border-r border-slate-200 font-bold bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800 text-center text-emerald-600 dark:text-emerald-400 select-all" title="Active Cell Address">
          {activeCellAddress}
        </div>
        
        {/* Formula label */}
        <div className="flex items-center justify-center px-3 text-slate-400 border-r border-slate-200 dark:border-slate-800 select-none italic text-[11px] font-sans font-bold">
          fx
        </div>

        {/* Formula Input Box */}
        <input
          type="text"
          value={formulaValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs bg-transparent border-none outline-none focus:ring-0 font-mono text-slate-800 dark:text-slate-200"
          placeholder="Enter values to simulate real-time updates..."
        />
      </div>

      {/* 4. The Sheet Grid Workspace */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto bg-slate-100 dark:bg-slate-950">
        <table className="w-full border-collapse border-spacing-0 select-none">
          <thead>
            {/* Column Letter Gutter */}
            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-semibold text-center border-b border-slate-200 dark:border-slate-800 text-[10px]">
              <th className="w-10 bg-slate-200 border-r border-slate-300 dark:bg-slate-900 dark:border-slate-800 shrink-0 sticky left-0 z-10"></th>
              {columns.map((col, colIdx) => (
                <th 
                  key={colIdx} 
                  className={`border-r border-slate-200 py-1 font-bold dark:border-slate-800 ${
                    activeCell.colIndex === colIdx ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold' : ''
                  }`}
                  style={{ minWidth: col.key === 'chargeName' ? '200px' : '110px' }}
                >
                  {col.letter}
                </th>
              ))}
            </tr>
            {/* Column Label Name */}
            <tr className={`${headerThemeClasses[headerTheme]} font-sans font-semibold text-left border-b text-[10px]`}>
              <th className="bg-slate-200 dark:bg-slate-900 border-r border-slate-350 sticky left-0 z-10"></th>
              {columns.map((col, colIdx) => (
                <th 
                  key={colIdx} 
                  className={`border-r border-slate-200/45 py-2 px-3 tracking-wide uppercase select-none ${
                    activeCell.colIndex === colIdx ? 'underline font-bold' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {gridData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                
                {/* Row Gutter Index */}
                <td className="bg-slate-100 dark:bg-slate-900 border-r border-slate-300 font-bold text-center text-slate-500 py-1 sticky left-0 z-10 border-b border-slate-200 dark:border-slate-800 text-[10px]">
                  {rowIdx + 1}
                </td>
                
                {/* Spreadsheet cell fields */}
                {columns.map((col, colIdx) => {
                  const val = row[col.key];
                  const isActive = activeCell.rowIndex === rowIdx && activeCell.colIndex === colIdx;
                  
                  // Text formatting
                  let textStyle = `px-3 py-1.5 border-r dark:border-slate-800 text-xs truncate focus:outline-none `;
                  
                  // Custom alignment
                  if (col.align === 'right') textStyle += 'text-right ';
                  else if (col.align === 'center') textStyle += 'text-center ';
                  else textStyle += 'text-left ';

                  // Gridlines configuration
                  if (gridlines) {
                    textStyle += 'border-b border-slate-100 dark:border-slate-800/60 ';
                  } else {
                    textStyle += 'border-b-0 ';
                  }

                  // Formatting simulation
                  if (boldText && isActive) textStyle += 'font-bold ';
                  if (italicText && isActive) textStyle += 'italic ';

                  return (
                    <td
                      key={colIdx}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      className={`${textStyle} transition-all cursor-cell relative ${
                        isActive 
                          ? 'ring-2 ring-emerald-500 ring-inset dark:ring-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/20 font-semibold' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      
                      {/* Render Badge for Status */}
                      {col.key === 'status' ? (
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          val === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {val}
                        </span>
                      ) : (
                        // Print values
                        col.numeric && typeof val === 'number' 
                          ? val.toLocaleString('en-IN') 
                          : String(val || '')
                      )}

                      {/* Small Active Cell square indicator at bottom right like excel */}
                      {isActive && (
                        <div className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-emerald-600 dark:bg-emerald-400 border border-white cursor-se-resize"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. SpreadSheet Tabs Bottom Bar */}
      <div className="flex items-center gap-1.5 bg-slate-100 border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 font-sans text-[11px] text-slate-500 px-3">
        <div className="flex items-center justify-center p-1 bg-slate-200 border-r border-slate-300 dark:bg-slate-950 dark:border-slate-800 shrink-0">
          ➕
        </div>
        {/* Active Sheet Tab */}
        <div className="bg-white px-4 py-1.5 font-bold text-emerald-700 border-t-2 border-emerald-600 dark:bg-slate-950 dark:text-emerald-400 dark:border-emerald-500 shadow-sm flex items-center gap-1 cursor-pointer">
          <span>📁</span>
          <span>Yet to Start</span>
        </div>
        <div className="px-4 py-1.5 hover:bg-slate-200/50 cursor-pointer transition">
          <span>Sheet2</span>
        </div>
      </div>

      {/* 6. SpreadSheet Excel Green Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-emerald-700 text-white dark:bg-emerald-900 font-sans text-[10px] tracking-wide font-medium">
        <div>
          <span>READY</span>
        </div>
        <div className="flex items-center gap-5">
          <span>Count: <strong className="font-mono">{count}</strong></span>
          <span>Sum (Expected Houses): <strong className="font-mono">{sumExpected.toLocaleString('en-IN')}</strong></span>
          <span>Average: <strong className="font-mono">{avgExpected.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>
    </div>
  );
}
export default function PerformanceTables({ 
  filteredData = [],
  chargesList = [],
  supervisorsList = [],
  rankings = {},
  supervisorsRanked = {},
  nonPerformingCharges = []
}) {
  const [activeSubTab, setActiveSubTab] = useState('exceptions'); // exceptions, rankings, supervisors, yet_to_start
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const itemsPerPage = 8;

  const isChargeLevel = filteredData && filteredData.some(row => row.isChargeLevel);
  const yetToStartItems = filteredData 
    ? filteredData.filter(item => {
        if (isChargeLevel) {
          return item.yetToStartHlbs > 0 || item.status === 'Yet To Start' || item.surveyedHouses === 0;
        } else {
          return item.status === 'Yet To Start' || item.surveyedHouses === 0;
        }
      })
    : [];
  const yetToStartCount = yetToStartItems.length;

  // Sorting Handler
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedData = (data) => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  // Reset page on search or tab change
  const handleTabChange = (tab) => {
    setActiveSubTab(tab);
    setSearchTerm('');
    setCurrentPage(1);
    setSortField('');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Tab Navigation & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange('exceptions')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'exceptions'
                ? 'bg-red-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            Not Working Properly ({nonPerformingCharges.length})
          </button>
          
          <button
            onClick={() => handleTabChange('rankings')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'rankings'
                ? 'bg-gov-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            Charge Rankings
          </button>

          <button
            onClick={() => handleTabChange('supervisors')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'supervisors'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            Supervisor Performance
          </button>

          <button
            onClick={() => handleTabChange('yet_to_start')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeSubTab === 'yet_to_start'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
            }`}
          >
            Yet To Start ({yetToStartCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-700 outline-none transition focus:border-gov-500 focus:ring-1 focus:ring-gov-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          />
        </div>
      </div>

      {/* RENDER TAB 1: EXCEPTIONS (NOT WORKING PROPERLY LIST) */}
      {activeSubTab === 'exceptions' && (() => {
        const filtered = nonPerformingCharges.filter(c => 
          c.chargeId.includes(searchTerm) || 
          c.chargeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.supervisorName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sorted = getSortedData(filtered);
        const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-red-50/10">
              <h3 className="font-display text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Attention Required: Non-Performing Charges
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Charges with Coverage less than 40% (Critical &lt; 20%, Warning 20%-40%).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-950">
                  <tr>
                    <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('chargeId')}>
                      <span className="flex items-center gap-1">Charge ID <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('chargeName')}>
                      <span className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('coveragePercent')}>
                      <span className="flex items-center gap-1">Coverage <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="py-4 px-6">Supervisor</th>
                    <th className="py-4 px-6">Performance Status</th>
                    <th className="py-4 px-6">Reason for Lag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.length > 0 ? (
                    paginated.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{item.chargeId}</td>
                        <td className="py-4 px-6 font-semibold">{item.chargeName}</td>
                        <td className="py-4 px-6 font-extrabold text-sm text-slate-800 dark:text-white">{item.coveragePercent}%</td>
                        <td className="py-4 px-6">{item.supervisorName}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            item.performanceStatus === 'Critical' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                            {item.performanceStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-600 dark:text-red-400">
                            {item.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">No non-performing charges found. All areas on track!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                <span className="text-slate-400 text-[11px]">Showing {Math.min(filtered.length, (currentPage-1)*itemsPerPage+1)} to {Math.min(filtered.length, currentPage*itemsPerPage)} of {filtered.length} entries</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(c => Math.max(1, c-1))} disabled={currentPage === 1} className="rounded-lg p-1 border border-slate-200 dark:border-slate-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} disabled={currentPage === totalPages} className="rounded-lg p-1 border border-slate-200 dark:border-slate-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* RENDER TAB 2: RANKINGS */}
      {activeSubTab === 'rankings' && (() => {
        const filtered = chargesList.filter(c => 
          c.chargeId.includes(searchTerm) || 
          c.chargeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sorted = getSortedData(filtered);
        const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top performing */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/10 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Top Performing Charges
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-950">
                    <tr>
                      <th className="py-3.5 px-6">Rank</th>
                      <th className="py-3.5 px-6">Charge ID</th>
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">Coverage</th>
                      <th className="py-3.5 px-6">Population</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rankings.topCharges.filter(c => c.chargeName.toLowerCase().includes(searchTerm.toLowerCase()) || c.chargeId.includes(searchTerm)).slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-6 font-bold text-emerald-600 dark:text-emerald-400">#{idx + 1}</td>
                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-white">{item.chargeId}</td>
                        <td className="py-3 px-6 font-semibold">{item.chargeName}</td>
                        <td className="py-3 px-6 font-extrabold text-slate-800 dark:text-white">{item.coveragePercent}%</td>
                        <td className="py-3 px-6">{item.totalPopulation.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom performing */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-red-50/10 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <h3 className="font-display text-sm font-bold text-red-700 dark:text-red-400">
                  Bottom Performing Charges
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-950">
                    <tr>
                      <th className="py-3.5 px-6">Rank</th>
                      <th className="py-3.5 px-6">Charge ID</th>
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">Coverage</th>
                      <th className="py-3.5 px-6">Population</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rankings.bottomCharges.filter(c => c.chargeName.toLowerCase().includes(searchTerm.toLowerCase()) || c.chargeId.includes(searchTerm)).slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-6 font-bold text-red-500">#{idx + 1}</td>
                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-white">{item.chargeId}</td>
                        <td className="py-3 px-6 font-semibold">{item.chargeName}</td>
                        <td className="py-3 px-6 font-extrabold text-slate-800 dark:text-white">{item.coveragePercent}%</td>
                        <td className="py-3 px-6">{item.totalPopulation.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RENDER TAB 3: SUPERVISORS */}
      {activeSubTab === 'supervisors' && (() => {
        const filtered = supervisorsList.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sorted = getSortedData(filtered);
        const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);

        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Best Supervisors */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/10 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Best Supervisors List
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-950">
                      <tr>
                        <th className="py-3.5 px-6">Supervisor</th>
                        <th className="py-3.5 px-6">Verification Rate</th>
                        <th className="py-3.5 px-6">Completed HLBs</th>
                        <th className="py-3.5 px-6">Total HLBs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {supervisorsRanked.best.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-6 font-bold text-slate-800 dark:text-white">{item.name}</td>
                          <td className="py-3 px-6 font-extrabold text-emerald-600 dark:text-emerald-400">{item.verificationPercent}%</td>
                          <td className="py-3 px-6 font-semibold">{item.completedHlbs}</td>
                          <td className="py-3 px-6">{item.totalHlbs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attention Required */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-red-50/10 flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-500" />
                  <h3 className="font-display text-sm font-bold text-red-700 dark:text-red-400">
                    Attention Required List
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-950">
                      <tr>
                        <th className="py-3.5 px-6">Supervisor</th>
                        <th className="py-3.5 px-6">Verification Rate</th>
                        <th className="py-3.5 px-6">Pending Houses</th>
                        <th className="py-3.5 px-6">Completed HLBs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {supervisorsRanked.attention.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-6 font-bold text-slate-800 dark:text-white">{item.name}</td>
                          <td className="py-3 px-6 font-extrabold text-red-500">{item.verificationPercent}%</td>
                          <td className="py-3 px-6 font-bold text-slate-800 dark:text-white">{item.pendingHouses.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-6">{item.completedHlbs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Complete Supervisors list */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white">
                  All Supervisors Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (sortField === 'name' && sortOrder === 'asc') {
                        setSortOrder('desc');
                      } else {
                        setSortField('name');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Sort: A to Z
                  </button>
                  <button
                    onClick={() => {
                      if (sortField === 'verificationPercent' && sortOrder === 'asc') {
                        setSortOrder('desc');
                      } else {
                        setSortField('verificationPercent');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Toggle Performance: Low to High
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-950">
                    <tr>
                      <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('name')}>
                        <span className="flex items-center gap-1">Supervisor Name <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('verificationPercent')}>
                        <span className="flex items-center gap-1">Verification Rate <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('pendingHouses')}>
                        <span className="flex items-center gap-1">Pending Houses <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('completedHlbs')}>
                        <span className="flex items-center gap-1">Completed HLBs <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                      <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort('totalHlbs')}>
                        <span className="flex items-center gap-1">Total HLBs <ArrowUpDown className="h-3.5 w-3.5" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginated.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="py-4 px-6 font-semibold">
                          <span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${
                            item.verificationPercent > 80 
                              ? 'text-emerald-600' 
                              : item.verificationPercent > 50 
                                ? 'text-amber-600' 
                                : 'text-red-500'
                          }`}>
                            {item.verificationPercent}%
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{item.pendingHouses.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-6 font-semibold">{item.completedHlbs}</td>
                        <td className="py-4 px-6">{item.totalHlbs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                  <span className="text-slate-400 text-[11px]">Showing {Math.min(filtered.length, (currentPage-1)*itemsPerPage+1)} to {Math.min(filtered.length, currentPage*itemsPerPage)} of {filtered.length} entries</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(c => Math.max(1, c-1))} disabled={currentPage === 1} className="rounded-lg p-1 border border-slate-200 dark:border-slate-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} disabled={currentPage === totalPages} className="rounded-lg p-1 border border-slate-200 dark:border-slate-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* RENDER TAB 4: YET TO START */}
      {activeSubTab === 'yet_to_start' && (() => {
        const yetToStartItems = filteredData 
          ? filteredData.filter(item => {
              if (isChargeLevel) {
                return item.yetToStartHlbs > 0 || item.status === 'Yet To Start' || item.surveyedHouses === 0;
              } else {
                return item.status === 'Yet To Start' || item.surveyedHouses === 0;
              }
            })
          : [];

        // Define columns matching Excel letters
        const columns = isChargeLevel ? [
          { key: 'chargeId', label: 'Charge ID', letter: 'A', align: 'left' },
          { key: 'chargeName', label: 'Area Name', letter: 'B', align: 'left' },
          { key: 'yetToStartHlbs', label: 'Yet to Start HLBs', letter: 'C', align: 'right', numeric: true },
          { key: 'totalHlbs', label: 'Total HLBs', letter: 'D', align: 'right', numeric: true },
          { key: 'supervisorName', label: 'Supervisor Name', letter: 'E', align: 'left' },
          { key: 'expectedHouses', label: 'Expected Houses', letter: 'F', align: 'right', numeric: true },
        ] : [
          { key: 'hlbId', label: 'HLB ID', letter: 'A', align: 'left' },
          { key: 'chargeName', label: 'Charge Name', letter: 'B', align: 'left' },
          { key: 'city', label: 'City', letter: 'C', align: 'center' },
          { key: 'zone', label: 'Zone', letter: 'D', align: 'center' },
          { key: 'ward', label: 'Ward', letter: 'E', align: 'center' },
          { key: 'area', label: 'Area', letter: 'F', align: 'left' },
          { key: 'supervisorName', label: 'Supervisor', letter: 'G', align: 'left' },
          { key: 'supervisorNumber', label: 'Supervisor No.', letter: 'H', align: 'left' },
          { key: 'enumeratorName', label: 'Enumerator', letter: 'I', align: 'left' },
          { key: 'enumeratorNumber', label: 'Enumerator No.', letter: 'J', align: 'left' },
          { key: 'expectedHouses', label: 'Expected Houses', letter: 'K', align: 'right', numeric: true },
          { key: 'status', label: 'Status', letter: 'L', align: 'center' }
        ];

        return (
          <div className="space-y-4">
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-center">
              <span className="text-lg">📊</span>
              <div>
                <h4 className="font-sans font-bold text-slate-800 dark:text-white">Excel-Style Interactive Workspace</h4>
                <p className="text-[11px] font-sans text-slate-500">
                  Select any cell to inspect or edit its values in the formula bar. Recalculations are processed in real-time.
                </p>
              </div>
            </div>

            <ExcelGridView 
              data={yetToStartItems} 
              columns={columns} 
              fileName={isChargeLevel ? "Janganana_Yet_To_Start_Charges" : "Janganana_Yet_To_Start_HLBs"} 
            />
          </div>
        );
      })()}
    </div>
  );
}
