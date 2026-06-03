import React, { useState } from 'react';
import { Search, Phone, Users, MapPin, Building, Hash, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

// Helper for professional name formatting
const toTitleCase = (str) => {
  if (!str) return '-';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export default function ContactReport({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [zoneFilter, setZoneFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [circleFilter, setCircleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [feedingFilter, setFeedingFilter] = useState('');

  // Filter to include only non-charge-level data for enumerator mapping
  const hlbData = data.filter(item => !item.isChargeLevel);

  const uniqueZones = [...new Set(hlbData.map(item => item.zone))].filter(Boolean).sort();
  const uniqueWards = [...new Set(hlbData.map(item => item.ward))].filter(Boolean).sort((a, b) => Number(a) - Number(b));
  const uniqueCircles = [...new Set(hlbData.map(item => item.supervisorCircle))].filter(Boolean).sort();

  const filteredData = hlbData.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      item.hlbId.toLowerCase().includes(term) ||
      (item.supervisorName && item.supervisorName.toLowerCase().includes(term)) ||
      (item.supervisorNumber && item.supervisorNumber.includes(term)) ||
      (item.enumeratorName && item.enumeratorName.toLowerCase().includes(term)) ||
      (item.enumeratorNumber && item.enumeratorNumber.includes(term)) ||
      (item.area && item.area.toLowerCase().includes(term))
    );

    const matchesZone = zoneFilter ? item.zone === zoneFilter : true;
    const matchesWard = wardFilter ? String(item.ward) === String(wardFilter) : true;
    const matchesCircle = circleFilter ? String(item.supervisorCircle) === String(circleFilter) : true;
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    
    const progressPercent = item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0;
    let matchesProgress = true;
    if (progressFilter) {
      if (progressFilter === '0') matchesProgress = progressPercent === 0;
      else if (progressFilter === '1-25') matchesProgress = progressPercent > 0 && progressPercent <= 25;
      else if (progressFilter === '26-50') matchesProgress = progressPercent > 25 && progressPercent <= 50;
      else if (progressFilter === '51-75') matchesProgress = progressPercent > 50 && progressPercent <= 75;
      else if (progressFilter === '76-99') matchesProgress = progressPercent > 75 && progressPercent < 100;
      else if (progressFilter === '100') matchesProgress = progressPercent === 100;
    }

    const feeding = item.surveyedHouses;
    let matchesFeeding = true;
    if (feedingFilter) {
      if (feedingFilter === '0') matchesFeeding = feeding === 0;
      else if (feedingFilter === '1-50') matchesFeeding = feeding > 0 && feeding <= 50;
      else if (feedingFilter === '51-100') matchesFeeding = feeding > 50 && feeding <= 100;
      else if (feedingFilter === '101-200') matchesFeeding = feeding > 100 && feeding <= 200;
      else if (feedingFilter === '201+') matchesFeeding = feeding > 200;
    }

    return matchesSearch && matchesZone && matchesWard && matchesCircle && matchesStatus && matchesProgress && matchesFeeding;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    const exportData = filteredData.map((item, index) => ({
      'Sr. No.': index + 1,
      'Charge ID': item.chargeId,
      'Uploaded HLB': item.hlbId,
      'Map HLB Code': item.originalHlbCode || '',
      'Village/Ward Name': item.villageWard || '',
      'Area': item.area,
      'Supervisor Circle': item.supervisorCircle || '',
      'Supervisor Name': toTitleCase(item.supervisorName),
      'Supervisor No.': item.supervisorNumber || '',
      'Enumerator Name': toTitleCase(item.enumeratorName),
      'Enumerator No.': item.enumeratorNumber || '',
      'Expected': item.expectedHouses,
      'Feeding': item.surveyedHouses,
      'Progress %': item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) + '%' : '0%'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Field Contacts");
    XLSX.writeFile(workbook, `Census_Field_Contacts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Sr. No.', 'Charge ID', 'Uploaded HLB', 'Map HLB Code', 'Village/Ward Name', 'Area', 'Supervisor Circle', 'Supervisor Name', 'Supervisor No.', 'Enumerator Name', 'Enumerator No.', 'Expected', 'Feeding', 'Progress %'];
    
    const rows = filteredData.map((item, index) => [
      index + 1,
      item.chargeId,
      item.hlbId,
      item.originalHlbCode || '',
      item.villageWard || '',
      item.area,
      item.supervisorCircle || '',
      toTitleCase(item.supervisorName),
      item.supervisorNumber || '',
      toTitleCase(item.enumeratorName),
      item.enumeratorNumber || '',
      item.expectedHouses,
      item.surveyedHouses,
      item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) + '%' : '0%'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Census_Field_Contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6 animate-slide-up print:p-0 print:space-y-2">
      <style>{`
        @media print {
          @page { size: landscape; margin: 6mm; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          }
          table { 
            width: 100% !important; 
            max-width: 100% !important; 
            font-size: 8px !important; 
            table-layout: fixed !important; 
            border-collapse: collapse !important;
          }
          th, td { 
            padding: 4px 3px !important; 
            white-space: normal !important; 
            border: 1px solid #cbd5e1 !important;
            vertical-align: middle !important;
          }
          th {
            font-size: 7px !important;
            font-weight: 800 !important;
            background-color: #f8fafc !important;
            color: #0f172a !important;
            /* Prevent breaking mid-word in headers */
            word-break: normal !important;
            overflow-wrap: normal !important;
          }
          td {
            color: #1e293b !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            line-height: 1.3 !important;
          }
          
          /* Force break on long numbers only */
          td:nth-child(2), td:nth-child(3) { word-break: break-all !important; }
          
          /* Optimized Column Widths */
          th:nth-child(1), td:nth-child(1) { width: 3.5%; text-align: center !important; } /* Sr No */
          th:nth-child(2), td:nth-child(2) { width: 8.5%; } /* Charge ID */
          th:nth-child(3), td:nth-child(3) { width: 10%; } /* Uploaded HLB */
          th:nth-child(4), td:nth-child(4) { width: 4.5%; }  /* Map HLB Code */
          th:nth-child(5), td:nth-child(5) { width: 8.5%; }  /* Village/Ward */
          th:nth-child(6), td:nth-child(6) { width: 9%; }  /* Area */
          th:nth-child(7), td:nth-child(7) { width: 4.5%; }  /* Sup Circle */
          th:nth-child(8), td:nth-child(8) { width: 10%; }  /* Supervisor Name */
          th:nth-child(9), td:nth-child(9) { width: 7.5%; }  /* Sup No */
          th:nth-child(10), td:nth-child(10) { width: 10%; }  /* Enum Name */
          th:nth-child(11), td:nth-child(11) { width: 7.5%; }  /* Enum No */
          th:nth-child(12), td:nth-child(12) { width: 5%; }  /* Expected */
          th:nth-child(13), td:nth-child(13) { width: 5.5%; }  /* Feeding */
          th:nth-child(14), td:nth-child(14) { width: 6%; }  /* Progress */
          
          .overflow-x-auto { overflow: hidden !important; }
        }
      `}</style>

      {/* Header section with Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70 print:hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Field Contacts Directory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage and view supervisor and enumerator contact details mapped across blocks.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full sm:w-auto items-end">
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={exportToExcel}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
              <button 
                onClick={exportToCSV}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
              >
                <FileText className="h-4 w-4" />
                CSV
              </button>
              <button 
                onClick={() => window.print()}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-slate-800/20 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all hidden sm:flex"
              >
                <Download className="h-4 w-4" />
                Print/PDF
              </button>
            </div>
            <div className="flex flex-wrap gap-2 w-full">
              <select
                value={zoneFilter}
                onChange={(e) => { setZoneFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Zones</option>
                {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <select
                value={wardFilter}
                onChange={(e) => { setWardFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Wards</option>
                {uniqueWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
              </select>
              <select
                value={circleFilter}
                onChange={(e) => { setCircleFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Sup. Circles</option>
                {uniqueCircles.map(c => <option key={c} value={c}>Circle {c}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Progress Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Yet To Start">Yet To Start</option>
              </select>
              <select
                value={progressFilter}
                onChange={(e) => { setProgressFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Progress %</option>
                <option value="0">0%</option>
                <option value="1-25">1% - 25%</option>
                <option value="26-50">26% - 50%</option>
                <option value="51-75">51% - 75%</option>
                <option value="76-99">76% - 99%</option>
                <option value="100">100%</option>
              </select>
              <select
                value={feedingFilter}
                onChange={(e) => { setFeedingFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Feeding Counts</option>
                <option value="0">0</option>
                <option value="1-50">1 - 50</option>
                <option value="51-100">51 - 100</option>
                <option value="101-200">101 - 200</option>
                <option value="201+">201+</option>
              </select>
            </div>
            <div className="relative w-full max-w-sm sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search names, numbers, or areas..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white/50 py-2.5 pl-9 pr-4 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:focus:bg-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Spreadsheet Data Grid */}
      <div className="rounded border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden print:border-none print:shadow-none">
        
        {/* Official Letterhead Header */}
        <div className="flex flex-col items-center justify-center p-8 border-b-4 border-double border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 print:bg-white print:border-none print:p-2 print:pb-4">
          
          {/* Screen Layout */}
          <div className="flex items-center gap-6 mb-4 print:hidden">
            <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain drop-shadow-md" />
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-wider uppercase">CENSUS OF INDIA 2027</h1>
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Government of India &bull; National Census</h2>
            </div>
          </div>
          <div className="w-full max-w-3xl border-t border-slate-300 dark:border-slate-600 pt-3 mt-1 text-center print:hidden">
            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Field Contacts & Enumeration Progress Report
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Data Refreshed: {data.length > 0 && data[0].date ? data[0].date : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Print Layout */}
          <div className="hidden print:flex w-full items-center justify-center gap-4 pb-2">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div className="flex flex-col items-center">
              <h1 className="font-bold text-sm text-black uppercase tracking-wide">
                Field Contacts & Enumeration Progress Report
              </h1>
              <p className="text-[10px] text-gray-700 font-medium mt-0.5">
                Data Refreshed: {data.length > 0 && data[0].date ? data[0].date : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible print:w-full">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse whitespace-nowrap print:whitespace-normal">
            <thead className="bg-slate-100 border-b-2 border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 print:bg-slate-100 print:border-black print:text-black">
              <tr>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4 text-center">Sr. No.</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Charge ID</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Uploaded HLB</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Map HLB Code</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Village/Ward Name</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Area</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4 text-center">Sup. Circle</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Supervisor Name</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Supervisor No.</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Enumerator Name</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4">Enumerator No.</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4 text-right">Expected</th>
                <th className="border-r border-slate-200 dark:border-slate-800 py-3 px-4 text-right">Feeding</th>
                <th className="py-3 px-4 text-right">Progress %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-400">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors print:break-inside-avoid">
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 text-center font-bold text-slate-500 print:border-slate-400 print:text-black">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 font-mono text-xs text-slate-500 print:border-slate-400 print:text-black">{item.chargeId}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-100 print:border-slate-400 print:text-black">{item.hlbId}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 font-mono text-purple-700 dark:text-purple-400 font-bold print:border-slate-400 print:text-black">{item.originalHlbCode || '-'}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 font-medium print:border-slate-400 print:text-black">{item.villageWard || '-'}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 font-medium print:border-slate-400 print:text-black">{item.area}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 text-center font-bold text-amber-700 dark:text-amber-500 print:border-slate-400 print:text-black">{item.supervisorCircle || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 print:border-slate-400 print:text-black">{toTitleCase(item.supervisorName)}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-mono font-medium text-amber-700 dark:text-amber-500 print:border-slate-400 print:text-black">{item.supervisorNumber || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 print:border-slate-400 print:text-black">{toTitleCase(item.enumeratorName)}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 font-mono font-medium text-emerald-700 dark:text-emerald-500 print:border-slate-400 print:text-black">{item.enumeratorNumber || '-'}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 text-right font-mono font-medium print:border-slate-400 print:text-black">{item.expectedHouses}</td>
                    <td className="border-r border-slate-200 dark:border-slate-700 py-3 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400 print:border-slate-400 print:text-black">{item.surveyedHouses}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300 print:border-slate-400 print:text-black">
                      {item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Users className="h-5 w-5 text-slate-400" />
                      </div>
                      <p>No contacts found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50 gap-4 print:hidden">
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-slate-500">
                Showing {filteredData.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} records
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-slate-500 font-medium px-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
