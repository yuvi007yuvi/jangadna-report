import React, { useState } from 'react';
import { Search, Phone, Users, MapPin, Building, Hash, Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper for professional name formatting
const toTitleCase = (str) => {
  if (!str) return '-';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const getProgressBadgeClass = (progress) => {
  if (progress >= 100) return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800";
  if (progress >= 95) return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800";
  if (progress >= 50) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800";
  if (progress > 0) return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800";
  return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

export default function ContactReport({ data = [], capProgressAt100 = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [zoneFilter, setZoneFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [circleFilter, setCircleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [minProgress, setMinProgress] = useState('');
  const [maxProgress, setMaxProgress] = useState('');
  const [feedingFilter, setFeedingFilter] = useState('');
  const [showAnomalies, setShowAnomalies] = useState(false);
  
  const [sortConfig, setSortConfig] = useState({ key: 'default', direction: 'asc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getDropdownSortValue = () => {
    if (sortConfig.key === 'default') return 'default';
    if (sortConfig.key === 'supervisor') {
      return sortConfig.direction === 'asc' ? 'default' : 'supervisor_desc';
    }
    if (sortConfig.key === 'progress') {
      return sortConfig.direction === 'asc' ? 'progress_asc' : 'progress_desc';
    }
    return 'custom';
  };

  const handleDropdownSortChange = (value) => {
    if (value === 'default') {
      setSortConfig({ key: 'default', direction: 'asc' });
    } else if (value === 'supervisor_desc') {
      setSortConfig({ key: 'supervisor', direction: 'desc' });
    } else if (value === 'progress_asc') {
      setSortConfig({ key: 'progress', direction: 'asc' });
    } else if (value === 'progress_desc') {
      setSortConfig({ key: 'progress', direction: 'desc' });
    }
    setCurrentPage(1);
  };

  const renderSortableHeader = (label, key, additionalClasses = '') => {
    const isSorted = sortConfig.key === key;
    return (
      <th
        onClick={() => requestSort(key)}
        className={`border border-slate-200 dark:border-slate-800 py-3 px-4 text-center cursor-pointer select-none group transition hover:bg-slate-200 dark:hover:bg-slate-800 print:bg-slate-100 print:text-black ${additionalClasses}`}
      >
        <div className="flex items-center justify-center gap-1">
          <span>{label}</span>
          <span className={`text-xs transition-opacity duration-150 print:hidden ${isSorted ? 'opacity-100 text-blue-600 dark:text-blue-400 font-extrabold' : 'opacity-0 group-hover:opacity-60 text-slate-400'}`}>
            {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲'}
          </span>
        </div>
      </th>
    );
  };

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
    
    let matchesProgress = true;
    let progressPercent = item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0;
    
    // Anomaly filter: >=100% progress but not completed
    if (showAnomalies) {
      if (!(progressPercent >= 100 && item.status !== 'Completed')) {
        return false;
      }
    }

    if (capProgressAt100) progressPercent = Math.min(100, progressPercent);

    if (progressFilter) {
      if (progressFilter === '0') matchesProgress = progressPercent === 0;
      else if (progressFilter === '1-25') matchesProgress = progressPercent > 0 && progressPercent <= 25;
      else if (progressFilter === '26-50') matchesProgress = progressPercent > 25 && progressPercent <= 50;
      else if (progressFilter === '51-75') matchesProgress = progressPercent > 50 && progressPercent <= 75;
      else if (progressFilter === '76-99') matchesProgress = progressPercent > 75 && progressPercent < 100;
      else if (progressFilter === '100') matchesProgress = progressPercent === 100;
      else if (progressFilter === '>100') matchesProgress = progressPercent > 100;
    }

    if (minProgress !== '') {
      if (progressPercent < Number(minProgress)) matchesProgress = false;
    }
    if (maxProgress !== '') {
      if (progressPercent > Number(maxProgress)) matchesProgress = false;
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

  // Sort the filtered data based on sortConfig
  filteredData.sort((a, b) => {
    if (sortConfig.key === 'default') {
      const nameA = (a.supervisorName || '').toLowerCase();
      const nameB = (b.supervisorName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }

    let valA, valB;
    if (sortConfig.key === 'supervisor') {
      valA = a.supervisorName || '';
      valB = b.supervisorName || '';
    } else if (sortConfig.key === 'enumerator') {
      valA = a.enumeratorName || '';
      valB = b.enumeratorName || '';
    } else if (sortConfig.key === 'charge') {
      valA = a.chargeId || '';
      valB = b.chargeId || '';
    } else if (sortConfig.key === 'hlb') {
      valA = a.hlbId || '';
      valB = b.hlbId || '';
    } else if (sortConfig.key === 'originalHlb') {
      valA = a.originalHlbCode || '';
      valB = b.originalHlbCode || '';
    } else if (sortConfig.key === 'villageWard') {
      valA = a.villageWard || '';
      valB = b.villageWard || '';
    } else if (sortConfig.key === 'area') {
      valA = a.area || '';
      valB = b.area || '';
    } else if (sortConfig.key === 'circle') {
      valA = a.supervisorCircle || '';
      valB = b.supervisorCircle || '';
    } else if (sortConfig.key === 'expected') {
      valA = a.expectedHouses || 0;
      valB = b.expectedHouses || 0;
    } else if (sortConfig.key === 'feeding') {
      valA = a.surveyedHouses || 0;
      valB = b.surveyedHouses || 0;
    } else if (sortConfig.key === 'progress') {
      valA = a.expectedHouses > 0 ? (a.surveyedHouses / a.expectedHouses) : 0;
      valB = b.expectedHouses > 0 ? (b.surveyedHouses / b.expectedHouses) : 0;
    } else if (sortConfig.key === 'status') {
      valA = a.status || '';
      valB = b.status || '';
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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    if (filteredData.length === 0) return;
    const exportData = filteredData.map((item, index) => ({
      'Sr. No.': index + 1,
      'Charge ID': item.chargeId || '',
      'HLB': item.hlbId || '',
      'Map HLB Code': item.originalHlbCode || '',
      'Village/Ward': item.villageWard || '',
      'Area': item.area,
      'Supervisor Circle': item.supervisorCircle || '',
      'Supervisor Name': toTitleCase(item.supervisorName),
      'Supervisor No.': item.supervisorNumber || '',
      'Enumerator Name': toTitleCase(item.enumeratorName),
      'Enumerator No.': item.enumeratorNumber || '',
      'Expected': item.expectedHouses,
      'Feeding': item.surveyedHouses,
      'Progress %': (capProgressAt100 
        ? (item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0)
        : (item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0)) + '%',
      'Status': item.status || 'Yet To Start'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Field Contacts");
    XLSX.writeFile(workbook, `Census_Field_Contacts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Sr. No.', 'Charge ID', 'HLB', 'Map HLB Code', 'Village/Ward Name', 'Area', 'Sup. Circle', 'Supervisor Name', 'Sup. No.', 'Enumerator Name', 'Enum. No.', 'Expected', 'Feeding', 'Progress %', 'Status'];
    
    const rows = filteredData.map((item, index) => [
      index + 1,
      item.chargeId || '',
      item.hlbId || '',
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
      (capProgressAt100 
        ? (item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0)
        : (item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0)) + '%',
      item.status || 'Yet To Start'
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

  const exportToPDF = async () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Try to load and embed the logo
    try {
      const img = new Image();
      img.src = '/logo.png';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const aspectRatio = img.width / img.height;
      const targetHeight = 24;
      const targetWidth = targetHeight * aspectRatio;
      doc.addImage(dataUrl, 'PNG', (pageWidth / 2) - 85, 6, targetWidth, targetHeight);
    } catch (e) {
      console.log('Could not load logo for PDF', e);
    }
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text("CENSUS OF INDIA 2027", (pageWidth / 2) + 5, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, 'bold');
    doc.text("GOVERNMENT OF INDIA • NATIONAL CENSUS", (pageWidth / 2) + 5, 26, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text("FIELD CONTACTS & ENUMERATION PROGRESS REPORT", pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, 'normal');
    doc.text(`Data Refreshed: ${data.length > 0 && data[0].date ? data[0].date : new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, 45, { align: 'center' });
    
    const tableHeaders = [['Sr. No.', 'Charge ID', 'HLB', 'Map HLB', 'Village/Ward', 'Area', 'Sup. Circle', 'Supervisor Name', 'Sup. No.', 'Enumerator Name', 'Enum. No.', 'Expected', 'Feeding', 'Progress', 'Status']];
    
    const tableData = filteredData.map((item, index) => [
      index + 1,
      item.chargeId || '-',
      item.hlbId || '-',
      item.originalHlbCode || '-',
      item.villageWard || '-',
      item.area || '-',
      item.supervisorCircle || '-',
      toTitleCase(item.supervisorName),
      item.supervisorNumber || '-',
      toTitleCase(item.enumeratorName),
      item.enumeratorNumber || '-',
      item.expectedHouses || '0',
      item.surveyedHouses || '0',
      (capProgressAt100 
        ? (item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0)
        : (item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0)) + '%',
      item.status || 'Yet To Start'
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 50,
      theme: 'grid',
      margin: { left: 5, right: 5, top: 10, bottom: 10 },
      styles: { fontSize: 6, cellPadding: 1.5, valign: 'middle', halign: 'center', lineWidth: 0.1, lineColor: [226, 232, 240], textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        11: { halign: 'right', cellWidth: 15 },
        12: { halign: 'center', cellWidth: 15 },
        13: { halign: 'center', cellWidth: 15 },
        14: { halign: 'center', cellWidth: 15 }
      },
      didParseCell: function (data) {
        if (data.section === 'body') {
          // Column 12: Feeding
          if (data.column.index === 12) {
            const feedingVal = parseInt(data.cell.text[0]) || 0;
            if (feedingVal > 0) {
              data.cell.styles.fillColor = [239, 246, 255]; // bg-blue-50
              data.cell.styles.textColor = [29, 78, 216]; // text-blue-700
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.fillColor = [248, 250, 252]; // bg-slate-50
              data.cell.styles.textColor = [100, 116, 139]; // text-slate-500
            }
          }
          
          // Column 13: Progress %
          if (data.column.index === 13) {
            const text = data.cell.text[0] || '0%';
            const progressVal = parseInt(text.replace('%', '')) || 0;
            
            if (progressVal >= 100) {
              data.cell.styles.fillColor = [209, 250, 229]; // bg-emerald-100
              data.cell.styles.textColor = [6, 95, 70]; // text-emerald-800
              data.cell.styles.fontStyle = 'bold';
            } else if (progressVal >= 95) {
              data.cell.styles.fillColor = [219, 234, 254]; // bg-blue-100
              data.cell.styles.textColor = [30, 64, 175]; // text-blue-800
              data.cell.styles.fontStyle = 'bold';
            } else if (progressVal >= 50) {
              data.cell.styles.fillColor = [254, 243, 199]; // bg-amber-100
              data.cell.styles.textColor = [146, 64, 14]; // text-amber-800
              data.cell.styles.fontStyle = 'bold';
            } else if (progressVal > 0) {
              data.cell.styles.fillColor = [255, 228, 230]; // bg-rose-100
              data.cell.styles.textColor = [159, 18, 57]; // text-rose-800
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.fillColor = [241, 245, 249]; // bg-slate-100
              data.cell.styles.textColor = [51, 65, 85]; // text-slate-800
            }
          }
          
          // Column 14: Status
          if (data.column.index === 14) {
            const statusVal = data.cell.text[0] || 'Yet To Start';
            if (statusVal === 'Completed') {
              data.cell.styles.fillColor = [209, 250, 229]; // bg-emerald-100
              data.cell.styles.textColor = [6, 95, 70]; // text-emerald-800
              data.cell.styles.fontStyle = 'bold';
            } else if (statusVal === 'In Progress') {
              data.cell.styles.fillColor = [219, 234, 254]; // bg-blue-100
              data.cell.styles.textColor = [30, 64, 175]; // text-blue-800
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.fillColor = [241, 245, 249]; // bg-slate-100
              data.cell.styles.textColor = [51, 65, 85]; // text-slate-800
            }
          }
        }
      },
      didDrawPage: function (data) {
        let str = 'Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });

    doc.save(`Census_Field_Contacts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 p-6 animate-slide-up print:p-0 print:space-y-2">
      <style>{`
        @media print {
          @page { size: landscape; margin: 6mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
          table { width: 100% !important; max-width: 100% !important; border-collapse: collapse !important; }
          th, td { padding: 4px 3px !important; white-space: normal !important; border: 1px solid #cbd5e1 !important; vertical-align: middle !important; }
          th { font-size: 10px !important; font-weight: 800 !important; background-color: #f8fafc !important; color: #0f172a !important; word-break: normal !important; overflow-wrap: normal !important; }
          td { font-size: 10px !important; color: #1e293b !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.4 !important; }
          td:nth-child(2), td:nth-child(3) { word-break: break-all !important; }
          th:nth-child(1), td:nth-child(1) { width: 3.5%; text-align: center !important; }
          th:nth-child(2), td:nth-child(2) { width: 8.5%; }
          th:nth-child(3), td:nth-child(3) { width: 10%; }
          th:nth-child(4), td:nth-child(4) { width: 4.5%; }
          th:nth-child(5), td:nth-child(5) { width: 8.5%; }
          th:nth-child(6), td:nth-child(6) { width: 8%; }
          th:nth-child(7), td:nth-child(7) { width: 4.5%; }
          th:nth-child(8), td:nth-child(8) { width: 10%; }
          th:nth-child(9), td:nth-child(9) { width: 7.5%; }
          th:nth-child(10), td:nth-child(10) { width: 10%; }
          th:nth-child(11), td:nth-child(11) { width: 7.5%; }
          th:nth-child(12), td:nth-child(12) { width: 5%; }
          th:nth-child(13), td:nth-child(13) { width: 5.5%; }
          th:nth-child(14), td:nth-child(14) { width: 5%; }
          th:nth-child(15), td:nth-child(15) { width: 8.5%; }
          .overflow-x-auto { overflow: visible !important; }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/70 print:hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5"></div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">Field Contacts Directory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage and view supervisor and enumerator contact details mapped across blocks.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full sm:w-auto items-end">
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={exportToExcel} className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all"><FileSpreadsheet className="h-4 w-4" />Excel</button>
              <button onClick={exportToCSV} className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"><FileText className="h-4 w-4" />CSV</button>
              <button onClick={exportToPDF} className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-red-500/20 transition-all"><Download className="h-4 w-4" />Download PDF</button>
              <button onClick={() => window.print()} className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-slate-800/20 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all hidden sm:flex"><FileText className="h-4 w-4" />Print Layout</button>
            </div>
            <div className="flex flex-wrap gap-2 w-full">
              <select value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Zones</option>
                {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <select value={wardFilter} onChange={(e) => { setWardFilter(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Wards</option>
                {uniqueWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
              </select>
              <select value={circleFilter} onChange={(e) => { setCircleFilter(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Sup. Circles</option>
                {uniqueCircles.map(c => <option key={c} value={c}>Circle {c}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Progress Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Yet To Start">Yet To Start</option>
              </select>
              <select value={progressFilter} onChange={(e) => { setProgressFilter(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Progress %</option>
                <option value="0">0%</option>
                <option value="1-25">1% - 25%</option>
                <option value="26-50">26% - 50%</option>
                <option value="51-75">51% - 75%</option>
                <option value="76-99">76% - 99%</option>
                <option value="100">{capProgressAt100 ? '100% Completed' : 'Exactly 100%'}</option>
                {!capProgressAt100 && <option value=">100">Exceeded (&gt;100%)</option>}
              </select>
              <select value={feedingFilter} onChange={(e) => { setFeedingFilter(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Feeding Counts</option>
                <option value="0">0</option>
                <option value="1-50">1 - 50</option>
                <option value="51-100">51 - 100</option>
                <option value="101-200">101 - 200</option>
                <option value="201+">201+</option>
              </select>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  placeholder="Min %" 
                  value={minProgress}
                  onChange={(e) => { setMinProgress(e.target.value); setCurrentPage(1); }}
                  className="w-20 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input 
                  type="number" 
                  placeholder="Max %" 
                  value={maxProgress}
                  onChange={(e) => { setMaxProgress(e.target.value); setCurrentPage(1); }}
                  className="w-20 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
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
            <div className="flex items-center ml-1 sm:ml-2 gap-4">
              <label className="flex items-center cursor-pointer relative group">
                <input type="checkbox" className="sr-only peer" checked={showAnomalies} onChange={(e) => { setShowAnomalies(e.target.checked); setCurrentPage(1); }} />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-600 group-hover:text-amber-600 peer-checked:text-amber-600 dark:text-slate-400 dark:peer-checked:text-amber-400 transition-colors">
                  Show Anomalies (≥100% Not Completed)
                </span>
              </label>
              <select value={getDropdownSortValue()} onChange={(e) => handleDropdownSortChange(e.target.value)} className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm">
                <option value="default">Sort: Supervisor (A-Z)</option>
                <option value="supervisor_desc">Sort: Supervisor (Z-A)</option>
                <option value="progress_asc">Sort: Progress (Low to High)</option>
                <option value="progress_desc">Sort: Progress (High to Low)</option>
                {getDropdownSortValue() === 'custom' && (
                  <option value="custom">Custom Column Sort</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden print:border-none print:shadow-none print:overflow-visible">
        
        <div className="flex flex-col items-center justify-center p-8 border-b-4 border-double border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 print:bg-white print:border-none print:p-2 print:pb-4">
          
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
          <table className="w-full text-left text-base text-slate-700 dark:text-slate-300 border-collapse whitespace-nowrap print:whitespace-normal">
            <thead className="bg-slate-100 border-b-2 border-slate-300 text-sm font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 print:bg-slate-100 print:border-black print:text-black">
              <tr>
                <th className="border border-slate-200 dark:border-slate-800 py-3 px-4 text-center print:bg-slate-100 print:text-black">Sr. No.</th>
                {renderSortableHeader('Charge ID', 'charge')}
                {renderSortableHeader('HLB', 'hlb')}
                {renderSortableHeader('Map HLB Code', 'originalHlb')}
                {renderSortableHeader('Village/Ward Name', 'villageWard')}
                {renderSortableHeader('Area', 'area')}
                {renderSortableHeader('Sup. Circle', 'circle')}
                {renderSortableHeader('Supervisor Name', 'supervisor')}
                <th className="border border-slate-200 dark:border-slate-800 py-3 px-4 print:bg-slate-100 print:text-black">Supervisor No.</th>
                {renderSortableHeader('Enumerator Name', 'enumerator')}
                <th className="border border-slate-200 dark:border-slate-800 py-3 px-4 print:bg-slate-100 print:text-black">Enumerator No.</th>
                {renderSortableHeader('Expected', 'expected', 'text-right')}
                {renderSortableHeader('Feeding', 'feeding', 'text-right')}
                {renderSortableHeader('Progress %', 'progress')}
                {renderSortableHeader('Status', 'status')}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:hidden">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const globalIndex = ((currentPage - 1) * itemsPerPage) + index + 1;
                  const progressValue = (capProgressAt100 
                    ? (item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0)
                    : (item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0));
                    
                  return (
                  <tr key={`screen-${index}`} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 text-center font-bold text-slate-500">{globalIndex}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-mono text-sm text-slate-500">{item.chargeId}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-100">{item.hlbId}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-mono text-purple-700 dark:text-purple-400 font-bold">{item.originalHlbCode || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-medium">{item.villageWard || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-medium">{item.area}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 text-center font-bold text-amber-700 dark:text-amber-500">{item.supervisorCircle || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{toTitleCase(item.supervisorName)}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-mono font-medium text-amber-700 dark:text-amber-500">{item.supervisorNumber || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{toTitleCase(item.enumeratorName)}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 font-mono font-medium text-emerald-700 dark:text-emerald-500">{item.enumeratorNumber || '-'}</td>
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 text-right font-mono font-medium">{item.expectedHouses}</td>
                    
                    {/* Feeding Column (Screen) */}
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 text-center">
                      {item.surveyedHouses > 0 ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border font-mono font-bold text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
                          {item.surveyedHouses}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border font-mono font-bold text-xs bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                          0
                        </span>
                      )}
                    </td>

                    {/* Progress Column (Screen) */}
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold text-xs border ${getProgressBadgeClass(progressValue)}`}>
                        {progressValue}%
                      </span>
                    </td>

                    {/* Status Column (Screen) */}
                    <td className="border border-slate-200 dark:border-slate-700 py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800' :
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800' :
                        'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {item.status || 'Yet To Start'}
                      </span>
                    </td>
                  </tr>
                )})

              ) : (
                <tr>
                  <td colSpan="15" className="py-12 text-center text-slate-500 dark:text-slate-400">
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

            <tbody className="hidden print:table-row-group print:divide-y print:divide-slate-400">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={`print-${index}`}>
                    <td className="border print:border-slate-400 py-3 px-4 text-center font-bold print:text-black">{index + 1}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-mono text-xs print:text-black">{item.chargeId}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-mono font-medium print:text-black">{item.hlbId}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-mono font-bold print:text-black">{item.originalHlbCode || '-'}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-medium print:text-black">{item.villageWard || '-'}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-medium print:text-black">{item.area}</td>
                    <td className="border print:border-slate-400 py-3 px-4 text-center font-bold print:text-black">{item.supervisorCircle || '-'}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-semibold print:text-black">{toTitleCase(item.supervisorName)}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-mono font-medium print:text-black">{item.supervisorNumber || '-'}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-semibold print:text-black">{toTitleCase(item.enumeratorName)}</td>
                    <td className="border print:border-slate-400 py-3 px-4 font-mono font-medium print:text-black">{item.enumeratorNumber || '-'}</td>
                    <td className="border print:border-slate-400 py-3 px-4 text-right font-mono font-medium print:text-black">{item.expectedHouses}</td>
                    
                    {/* Feeding Column (Print) */}
                    <td className="border print:border-slate-400 py-3 px-4 text-center">
                      {item.surveyedHouses > 0 ? (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border font-mono font-bold text-xs bg-blue-50 text-blue-700 border-blue-200 print:bg-blue-100 print:text-blue-800 print:border-blue-300">
                          {item.surveyedHouses}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border font-mono font-bold text-xs bg-slate-50 text-slate-500 border-slate-200 print:bg-slate-100 print:text-slate-600 print:border-slate-300">
                          0
                        </span>
                      )}
                    </td>

                    {/* Progress Column (Print) */}
                    <td className="border print:border-slate-400 py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold text-xs border ${getProgressBadgeClass(
                        capProgressAt100 
                          ? (item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0)
                          : (item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0)
                      )}`}>
                        {(capProgressAt100 
                          ? (item.expectedHouses > 0 ? Math.min(100, Math.round((item.surveyedHouses / item.expectedHouses) * 100)) : 0)
                          : (item.expectedHouses > 0 ? Math.round((item.surveyedHouses / item.expectedHouses) * 100) : 0))}%
                      </span>
                    </td>

                    {/* Status Column (Print) */}
                    <td className="border print:border-slate-400 py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-300' :
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300 print:bg-blue-100 print:text-blue-800 print:border-blue-300' :
                        'bg-slate-100 text-slate-800 border-slate-300 print:bg-slate-100 print:text-slate-700 print:border-slate-300'
                      }`}>
                        {item.status || 'Yet To Start'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="15" className="py-12 text-center text-slate-500">
                    No contacts found.
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
