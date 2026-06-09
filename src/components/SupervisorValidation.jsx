import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  List,
  Printer
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { STAFF_MAPPING } from '../utils/staffMapping';
export default function SupervisorValidation({ rawCensusData }) {
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'mismatch', 'match'
  const [minDifference, setMinDifference] = useState('');
  const [maxDifference, setMaxDifference] = useState('');
  const [viewMode, setViewMode] = useState('supervisor'); // 'hlb', 'supervisor'
  
  const [sortConfig, setSortConfig] = useState({ key: 'default', direction: 'asc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getDropdownSortValue = () => {
    if (sortConfig.key === 'default') return 'default';
    if (sortConfig.key === 'supervisor') {
      return sortConfig.direction === 'asc' ? 'asc' : 'desc';
    }
    if (sortConfig.key === 'difference') {
      return sortConfig.direction === 'desc' ? 'diff-desc' : 'diff-asc';
    }
    return 'custom';
  };

  const handleDropdownSortChange = (value) => {
    if (value === 'default') {
      setSortConfig({ key: 'default', direction: 'asc' });
    } else if (value === 'asc') {
      setSortConfig({ key: 'supervisor', direction: 'asc' });
    } else if (value === 'desc') {
      setSortConfig({ key: 'supervisor', direction: 'desc' });
    } else if (value === 'diff-desc') {
      setSortConfig({ key: 'difference', direction: 'desc' });
    } else if (value === 'diff-asc') {
      setSortConfig({ key: 'difference', direction: 'asc' });
    }
  };

  const renderSortableHeader = (label, key, additionalClasses = '') => {
    const isSorted = sortConfig.key === key;
    return (
      <th
        onClick={() => requestSort(key)}
        className={`px-4 py-3 border border-slate-200 dark:border-slate-700 text-center cursor-pointer select-none group transition hover:bg-slate-200 dark:hover:bg-slate-800 ${additionalClasses}`}
      >
        <div className="flex items-center justify-center gap-1">
          <span>{label}</span>
          <span className={`text-xs transition-opacity duration-150 ${isSorted ? 'opacity-100 text-gov-600 dark:text-gov-400 font-extrabold' : 'opacity-0 group-hover:opacity-60 text-slate-400'}`}>
            {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲'}
          </span>
        </div>
      </th>
    );
  };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    setSuccess('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length === 0) {
          setError('The spreadsheet appears to be empty.');
          return;
        }

        const headers = json[0];
        const rows = json.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = row[i];
          });
          return obj;
        });

        const hasHlbs = headers.some(h => String(h).toLowerCase().trim() === 'hlbs');
        if (!hasHlbs) {
          setError('Invalid file format. The file must contain an "HLBs" column.');
          return;
        }

        processData(rows);
      } catch (err) {
        setError(`Failed to read file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  const processData = (rows) => {
    let matchedCount = 0;
    let mismatchCount = 0;

    const processedRows = rows.map(row => {
      const hlbIdVal = String(row['HLBs'] || '').trim();
      const excelVerified = parseInt(row['Households Verified By Supervisor']) || parseInt(row['Households Verified By']) || 0;
      const excelExpected = parseInt(row['Total number of Households']) || parseInt(row['Total number of Househ']) || 0;
      const remark = row['Remark'] || row['Supervisor Remarks'] || '';

      // Try to find the matching HLB in master data
      // Sometimes HLB is the full string, sometimes just the short code
      const masterRecord = rawCensusData.find(d =>
        String(d.hlbId).trim() === hlbIdVal ||
        String(d.originalHlbCode).trim() === hlbIdVal
      );

      const masterVerified = masterRecord ? (masterRecord.verifiedHouseholds || 0) : null;
      const masterSurveyed = masterRecord ? (masterRecord.surveyedHouses || 0) : null;

      const isMismatch = masterRecord ? (excelVerified !== masterSurveyed && excelVerified !== masterVerified) : false;

      if (masterRecord) {
        if (isMismatch) mismatchCount++;
        else matchedCount++;
      }

      // Extract core HLB for STAFF_MAPPING lookup
      let coreHlb = hlbIdVal;
      if (hlbIdVal.length >= 19) {
        coreHlb = hlbIdVal.substring(15, 19);
      } else {
        let cleanHlb = hlbIdVal;
        if (cleanHlb.endsWith('00') && cleanHlb.length > 6) {
          cleanHlb = cleanHlb.slice(0, -2);
        }
        coreHlb = cleanHlb.slice(-4).padStart(4, '0');
      }

      const staffInfo = STAFF_MAPPING[coreHlb] || STAFF_MAPPING[parseInt(coreHlb, 10).toString()];

      const masterSupervisorName = staffInfo ? staffInfo.supervisor : (masterRecord ? masterRecord.supervisorName : 'Not Found');
      const masterSupervisorNumber = staffInfo ? staffInfo.supervisorMobile : (masterRecord ? masterRecord.supervisorNumber : (row['Supervisor Number'] || row['Supervisor Mobile'] || ''));
      const masterSupervisorCircle = staffInfo ? staffInfo.supervisorCircle : (masterRecord ? masterRecord.supervisorCircle : (row['Supervisor Circle'] || ''));

      return {
        wardNo: row['Ward No'],
        hlbId: hlbIdVal,
        excelExpected,
        excelVerified,
        excelDifference: parseInt(row['Difference Supervisor Count']) || parseInt(row['Difference']) || 0,
        excelPopulation: parseInt(row['Total Population']) || 0,
        masterRecord,
        masterVerified,
        masterSurveyed,
        masterSupervisor: masterSupervisorName,
        masterSupervisorNumber: masterSupervisorNumber,
        masterSupervisorCircle: masterSupervisorCircle,
        remark: remark,
        isMismatch
      };
    }).filter(r => r.hlbId); // filter out empty rows

    const supervisorMap = {};
    processedRows.forEach(row => {
      const sup = row.masterSupervisor;
      if (!supervisorMap[sup]) {
        supervisorMap[sup] = {
          name: sup,
          number: row.masterSupervisorNumber || '',
          circle: row.masterSupervisorCircle || '',
          hlbCount: 0,
          excelExpected: 0,
          excelVerified: 0,
          excelDifference: 0,
          masterSurveyed: 0,
          mismatches: 0
        };
      }
      supervisorMap[sup].hlbCount++;
      supervisorMap[sup].excelExpected += row.excelExpected;
      supervisorMap[sup].excelVerified += row.excelVerified;
      supervisorMap[sup].excelDifference += row.excelDifference;
      supervisorMap[sup].masterSurveyed += (row.masterSurveyed || 0);
      if (row.isMismatch) supervisorMap[sup].mismatches++;
    });

    const supervisors = Object.values(supervisorMap).sort((a, b) => b.mismatches - a.mismatches);

    setFileData({
      rows: processedRows,
      supervisors,
      matchedCount,
      mismatchCount,
      totalCount: processedRows.length
    });
    setSuccess(`Successfully analyzed ${processedRows.length} rows against master data.`);
  };

  const filteredData = useMemo(() => {
    if (!fileData) return [];

    let filtered = fileData.rows.filter(row => {
      const matchesSearch =
        row.hlbId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.wardNo && String(row.wardNo).toLowerCase().includes(searchTerm.toLowerCase())) ||
        row.masterSupervisor.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (filterType === 'mismatch') matchesFilter = row.isMismatch;
      else if (filterType === 'match') matchesFilter = !row.isMismatch && row.masterRecord;
      else if (filterType === 'unmatched') matchesFilter = !row.masterRecord;

      let matchesDifference = true;
      const difference = row.excelDifference;
      if (minDifference !== '') {
        const minVal = parseInt(minDifference);
        if (!isNaN(minVal)) {
          matchesDifference = matchesDifference && difference >= minVal;
        }
      }
      if (maxDifference !== '') {
        const maxVal = parseInt(maxDifference);
        if (!isNaN(maxVal)) {
          matchesDifference = matchesDifference && difference <= maxVal;
        }
      }

      return matchesSearch && matchesFilter && matchesDifference;
    });

    if (sortConfig.key !== 'default') {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'supervisor') {
          valA = a.masterSupervisor || '';
          valB = b.masterSupervisor || '';
        } else if (sortConfig.key === 'hlb') {
          valA = a.hlbId || '';
          valB = b.hlbId || '';
        } else if (sortConfig.key === 'ward') {
          valA = parseInt(a.wardNo) || 0;
          valB = parseInt(b.wardNo) || 0;
        } else if (sortConfig.key === 'circle') {
          valA = a.masterSupervisorCircle || '';
          valB = b.masterSupervisorCircle || '';
        } else if (sortConfig.key === 'expected') {
          valA = a.excelExpected || 0;
          valB = b.excelExpected || 0;
        } else if (sortConfig.key === 'verified') {
          valA = a.excelVerified || 0;
          valB = b.excelVerified || 0;
        } else if (sortConfig.key === 'difference') {
          valA = a.excelDifference || 0;
          valB = b.excelDifference || 0;
        } else if (sortConfig.key === 'progress') {
          valA = a.excelExpected > 0 ? (a.excelVerified / a.excelExpected) * 100 : 0;
          valB = b.excelExpected > 0 ? (b.excelVerified / b.excelExpected) * 100 : 0;
        }

        if (valA === valB) return 0;
        if (typeof valA === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortConfig.direction === 'asc'
            ? valA - valB
            : valB - valA;
        }
      });
    }

    return filtered;
  }, [fileData, searchTerm, filterType, minDifference, maxDifference, sortConfig]);

  const filteredSupervisors = useMemo(() => {
    if (!fileData) return [];
    let filtered = fileData.supervisors.filter(sup => {
      const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDifference = true;
      const difference = sup.excelDifference;
      if (minDifference !== '') {
        const minVal = parseInt(minDifference);
        if (!isNaN(minVal)) {
          matchesDifference = matchesDifference && difference >= minVal;
        }
      }
      if (maxDifference !== '') {
        const maxVal = parseInt(maxDifference);
        if (!isNaN(maxVal)) {
          matchesDifference = matchesDifference && difference <= maxVal;
        }
      }

      return matchesSearch && matchesDifference;
    });

    if (sortConfig.key !== 'default') {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'supervisor') {
          valA = a.name || '';
          valB = b.name || '';
        } else if (sortConfig.key === 'circle') {
          valA = a.circle || '';
          valB = b.circle || '';
        } else if (sortConfig.key === 'totalHlbs') {
          valA = a.hlbCount || 0;
          valB = b.hlbCount || 0;
        } else if (sortConfig.key === 'expected') {
          valA = a.excelExpected || 0;
          valB = b.excelExpected || 0;
        } else if (sortConfig.key === 'verified') {
          valA = a.excelVerified || 0;
          valB = b.excelVerified || 0;
        } else if (sortConfig.key === 'difference') {
          valA = a.excelDifference || 0;
          valB = b.excelDifference || 0;
        } else if (sortConfig.key === 'progress') {
          valA = a.excelExpected > 0 ? (a.excelVerified / a.excelExpected) * 100 : 0;
          valB = b.excelExpected > 0 ? (b.excelVerified / b.excelExpected) * 100 : 0;
        }

        if (valA === valB) return 0;
        if (typeof valA === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortConfig.direction === 'asc'
            ? valA - valB
            : valB - valA;
        }
      });
    }

    return filtered;
  }, [fileData, searchTerm, minDifference, maxDifference, sortConfig]);

  const supervisorTotals = useMemo(() => {
    if (!filteredSupervisors) return null;
    return filteredSupervisors.reduce((acc, curr) => ({
      hlbCount: acc.hlbCount + curr.hlbCount,
      excelExpected: acc.excelExpected + curr.excelExpected,
      excelVerified: acc.excelVerified + curr.excelVerified,
      excelDifference: acc.excelDifference + curr.excelDifference,
      masterSurveyed: acc.masterSurveyed + curr.masterSurveyed,
      mismatches: acc.mismatches + curr.mismatches
    }), {
      hlbCount: 0,
      excelExpected: 0,
      excelVerified: 0,
      excelDifference: 0,
      masterSurveyed: 0,
      mismatches: 0
    });
  }, [filteredSupervisors]);

  if (!rawCensusData || rawCensusData.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-8 text-center text-slate-500">
        <Activity className="mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Master Data Loaded</h3>
        <p className="mt-2 text-sm text-slate-400">Please upload the master census sheet in the Data Upload tab first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <style>{`
        @media print {
          table {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table th, table td, table span, table div, table h1, table h2, table h3 {
            color: #000 !important;
          }
          table, table th, table td {
            border-color: #000 !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Supervisor Validation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload supervisor-level exports to cross-reference with the master census database and identify discrepancies.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 dark:border-red-500/30 print:hidden">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/5 p-4 text-sm text-emerald-600 dark:border-emerald-500/30 print:hidden">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Subject Header & Logo moved to tables */}

      {!fileData ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center transition hover:border-gov-400 dark:border-slate-800 dark:bg-slate-900">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gov-50 text-gov-600 dark:bg-gov-950/50 dark:text-gov-400">
            <Upload className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-slate-700 dark:text-white">
            Upload Supervisor Excel File
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Upload files like "Auranagbad Zone _Supervisor For.xlsx" to analyze verified households against the live master progress.
          </p>
          <button
            onClick={() => fileInputRef.current.click()}
            className="mt-6 rounded-xl bg-gov-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-gov-500 transition"
          >
            Select File
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search HLB or Supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-gov-500 focus:ring-1 focus:ring-gov-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('hlb')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'hlb' ? 'bg-white shadow-sm text-gov-600 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">HLB View</span>
                </button>
                <button
                  onClick={() => setViewMode('supervisor')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'supervisor' ? 'bg-white shadow-sm text-gov-600 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Supervisor Totals</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={getDropdownSortValue()}
                onChange={(e) => handleDropdownSortChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-gov-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="default">Default Sort</option>
                <option value="asc">A to Z (Supervisor)</option>
                <option value="desc">Z to A (Supervisor)</option>
                <option value="diff-desc">Difference (High to Low)</option>
                <option value="diff-asc">Difference (Low to High)</option>
                {getDropdownSortValue() === 'custom' && (
                  <option value="custom">Custom Column Sort</option>
                )}
              </select>

              {/* Difference Range Filter: Min to Max */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 h-10 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Difference:</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minDifference}
                  onChange={(e) => setMinDifference(e.target.value)}
                  className="w-12 h-7 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 outline-none transition focus:border-gov-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-slate-400 font-medium">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxDifference}
                  onChange={(e) => setMaxDifference(e.target.value)}
                  className="w-12 h-7 text-center text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 outline-none transition focus:border-gov-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {viewMode === 'hlb' && (
                <>
                  <Filter className="h-4 w-4 text-slate-400 ml-2 hidden lg:block" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-gov-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="all">Show All Match Types</option>
                    <option value="mismatch">Discrepancies Only</option>
                    <option value="match">Perfect Matches Only</option>
                    <option value="unmatched">Not Found in Master</option>
                  </select>
                </>
              )}

              <button
                onClick={() => window.print()}
                className="ml-2 flex items-center gap-2 h-10 rounded-xl bg-slate-800 text-white px-4 text-sm font-semibold hover:bg-slate-900 transition dark:bg-slate-700 dark:hover:bg-slate-600 shrink-0 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
              <button
                onClick={() => setFileData(null)}
                className="ml-2 h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold hover:bg-slate-100 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white shrink-0"
              >
                New File
              </button>
            </div>
          </div>

          {/* Data Table */}
          {viewMode === 'hlb' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:overflow-visible">
              <table className="w-full text-center text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <tr>
                    <th colSpan="10" className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700 py-6">
                      <div className="flex flex-col items-center justify-center">
                        <img src={logoImg} alt="Janganana Logo" className="h-32 w-32 object-contain mb-4" />
                        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">CENSUS OF INDIA 2027</h1>
                        <h2 className="text-md font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">Ministry of Home Affairs, Government of India</h2>
                        <h3 className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">Janganana Bureau - Supervisor Validation Report</h3>
                        <span className="text-xs text-slate-800 mt-1 font-normal">Report Compiled on: {new Date().toLocaleDateString('en-IN')}</span>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 border border-slate-200 dark:border-slate-700 w-16 text-center">Sr. No.</th>
                    {renderSortableHeader('Ward No', 'ward')}
                    {renderSortableHeader('HLBs', 'hlb')}
                    {renderSortableHeader('Supervisor Name', 'supervisor')}
                    {renderSortableHeader('Circle', 'circle')}
                    <th className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-center">Contact No.</th>
                    {renderSortableHeader('Total number of Househ', 'expected', 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300')}
                    {renderSortableHeader('Households Verified By', 'verified', 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300')}
                    {renderSortableHeader('Difference', 'difference')}
                    <th className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-center">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-slate-900 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700">{row.wardNo || '-'}</td>
                        <td className="px-4 py-3 font-mono text-center border border-slate-200 dark:border-slate-700 font-bold">{row.hlbId}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 font-semibold text-slate-900">{row.masterSupervisor}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-slate-800 text-xs">{row.masterSupervisorCircle || '-'}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-slate-800 font-mono text-xs">{row.masterSupervisorNumber || '-'}</td>

                        <td className="px-4 py-3 text-center font-mono border border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10">{row.excelExpected}</td>
                        <td className="px-4 py-3 text-center font-mono border border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10 font-bold">{row.excelVerified}</td>

                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700">
                          {row.excelDifference > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md border font-mono font-bold text-xs bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800">
                              +{row.excelDifference}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md border font-mono font-bold text-xs bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              0
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-xs">{row.remark || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-slate-900 font-medium">
                        No matching records found based on current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:overflow-visible">
              <table className="w-full text-center text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                  <tr>
                    <th colSpan="9" className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700 py-6">
                      <div className="flex flex-col items-center justify-center">
                        <img src={logoImg} alt="Janganana Logo" className="h-32 w-32 object-contain mb-4" />
                        <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">CENSUS OF INDIA 2027</h1>
                        <h2 className="text-md font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">Ministry of Home Affairs, Government of India</h2>
                        <h3 className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">Janganana Bureau - Supervisor Validation Report</h3>
                        <span className="text-xs text-slate-800 mt-1 font-normal">Report Compiled on: {new Date().toLocaleDateString('en-IN')}</span>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 border border-slate-200 dark:border-slate-700 w-16 text-center">Sr. No.</th>
                    {renderSortableHeader('Supervisor Name', 'supervisor')}
                    {renderSortableHeader('Circle', 'circle')}
                    <th className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-center">Contact No.</th>
                    {renderSortableHeader('Total HLBs', 'totalHlbs')}
                    {renderSortableHeader('Total number of Househ', 'expected', 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300')}
                    {renderSortableHeader('Households Verified By', 'verified', 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300')}
                    {renderSortableHeader('Difference', 'difference')}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSupervisors.length > 0 ? (
                    filteredSupervisors.map((sup, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-slate-900 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 font-semibold text-slate-900">{sup.name}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-slate-800 text-xs">{sup.circle || '-'}</td>
                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-slate-800 font-mono text-xs">{sup.number || '-'}</td>
                        <td className="px-4 py-3 text-center font-mono border border-slate-200 dark:border-slate-700">{sup.hlbCount}</td>

                        <td className="px-4 py-3 text-center font-mono border border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10">{sup.excelExpected}</td>
                        <td className="px-4 py-3 text-center font-mono border border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10 font-bold">{sup.excelVerified}</td>

                        <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700">
                          {sup.excelDifference > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md border font-mono font-bold text-xs bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800">
                              +{sup.excelDifference}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md border font-mono font-bold text-xs bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              0
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-900 font-medium">
                        No supervisors found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {supervisorTotals && filteredSupervisors.length > 0 && (
                  <tbody className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-right uppercase tracking-wider text-xs border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white">Grand Total:</td>
                      <td className="px-4 py-4 text-center font-mono border border-slate-200 dark:border-slate-700">{supervisorTotals.hlbCount}</td>
                      <td className="px-4 py-4 text-center font-mono border border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20">{supervisorTotals.excelExpected}</td>
                      <td className="px-4 py-4 text-center font-mono border border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20">{supervisorTotals.excelVerified}</td>
                      <td colSpan="2" className={`px-4 py-4 text-center font-mono border border-slate-200 dark:border-slate-700 ${supervisorTotals.excelDifference > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {supervisorTotals.excelDifference}
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
