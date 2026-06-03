// src/components/FileUpload.jsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  RefreshCw
} from 'lucide-react';
import { WARD_MAPPING } from '../utils/wardMapping';
import { STAFF_MAPPING } from '../utils/staffMapping';

const REQUIRED_FIELDS = [
  { key: 'chargeId', label: 'Charge ID / Code', description: 'Unique identifier for the area' },
  { key: 'chargeName', label: 'Charge Name', description: 'Name of the zone or ward' },
  { key: 'hlbId', label: 'HLB ID / Block Code', description: 'House Listing Block code' },
  { key: 'supervisorName', label: 'Supervisor Name', description: 'Name of the supervisor' },
  { key: 'enumeratorName', label: 'Enumerator Name', description: 'Name of the field agent/enumerator' },
  { key: 'expectedHouses', label: 'Expected Houses', description: 'Target number of houses to survey' },
  { key: 'surveyedHouses', label: 'Surveyed Houses', description: 'Actual houses surveyed so far' },
  { key: 'totalPopulation', label: 'Total Population', description: 'Total population counted' },
  { key: 'verifiedHouseholds', label: 'Verified Households', description: 'Households verified by supervisor' },
  { key: 'status', label: 'Progress Status', description: 'Status: Completed, In Progress, Yet To Start' }
];

export default function FileUpload({ onDataLoaded, onLoadDemoData }) {
  const [fileName, setFileName] = useState('');
  const [fileHeaders, setFileHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [showMapper, setShowMapper] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  // Auto-detection mapping configurations
  const detectMapping = (headers) => {
    const detected = {};
    const lowerHeaders = headers.map(h => String(h).toLowerCase().trim().replace(/[\s_-]/g, ''));

    REQUIRED_FIELDS.forEach(field => {
      const matchIndex = lowerHeaders.findIndex(lh => {
        // Matches e.g. "chargeid", "chargecode", "charge"
        if (field.key === 'chargeId') return lh.includes('chargeid') || lh.includes('chargecode') || lh === 'charge';
        if (field.key === 'chargeName') return lh.includes('chargename') || lh.includes('blockname') || lh === 'name';
        if (field.key === 'hlbId') return lh.includes('hlb') || lh.includes('blockcode') || lh.includes('blockid');
        if (field.key === 'supervisorName') return lh.includes('supervisor') || lh.includes('supervisior');
        if (field.key === 'enumeratorName') return lh.includes('enumerator') || lh.includes('agent') || lh.includes('operator');
        if (field.key === 'expectedHouses') return lh.includes('expected') || lh.includes('target') || lh.includes('totalhouse');
        if (field.key === 'surveyedHouses') return lh.includes('surveyed') || lh.includes('completedhouses') || lh.includes('survey');
        if (field.key === 'totalPopulation') return lh.includes('population') || lh.includes('people') || lh.includes('pop');
        if (field.key === 'verifiedHouseholds') return lh.includes('verified') || lh.includes('verification') || lh.includes('approved');
        if (field.key === 'status') return lh.includes('status') || lh.includes('progress');
        return false;
      });

      if (matchIndex !== -1) {
        detected[field.key] = headers[matchIndex];
      } else {
        detected[field.key] = ''; // default empty
      }
    });

    return detected;
  };

  const handleFileChange = (e) => {
    setError('');
    setSuccessMsg('');
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
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

        // Detect pre-aggregated Charge-Level vs Block-level (HLB) spreadsheets
        const isHlbSheet = headers.some(h =>
          String(h).toLowerCase().trim() === 'hlbs'
        );

        const isChargeSheet = !isHlbSheet && headers.some(h =>
          String(h).toLowerCase().trim() === 'charge wise' ||
          String(h).toLowerCase().includes('expected census houses')
        );

        if (isHlbSheet) {
          const processed = [];

          rows.forEach((row, idx) => {
            const wardNoVal = String(row['Ward No'] || '').trim();
            // Skip total rows
            if (!wardNoVal ||
              wardNoVal.toLowerCase().includes('total') ||
              wardNoVal.startsWith('-') ||
              wardNoVal === ' - Total' ||
              wardNoVal === 'Total') {
              return;
            }

            const hlbIdVal = String(row['HLBs'] || '').trim();
            if (!hlbIdVal) return;

            // Match HLB number after 15 characters (words) and use 4 numbers (ignoring last 2 zeros)
            let coreHlb = hlbIdVal;
            if (hlbIdVal.length >= 19) {
              // Extract exactly 4 digits after the first 15 characters
              coreHlb = hlbIdVal.substring(15, 19);
            } else {
              // Fallback for differently formatted HLBs
              let cleanHlb = hlbIdVal;
              if (cleanHlb.endsWith('00') && cleanHlb.length > 6) {
                cleanHlb = cleanHlb.slice(0, -2);
              }
              coreHlb = cleanHlb.slice(-4).padStart(4, '0');
            }

            let wardIndex = parseInt(coreHlb, 10);

            // Fallback to ward column if HLB matching fails or isn't in mapping
            if (!wardIndex || !WARD_MAPPING[String(wardIndex)]) {
              const cleanWard = wardNoVal.replace(/[^0-9]/g, '');
              wardIndex = parseInt(cleanWard, 10) || 1;
            }

            const wardInfo = WARD_MAPPING[String(wardIndex)];
            const standardChargeId = `1000000721600` + String(wardIndex).padStart(2, '0');
            const chargeName = wardInfo ? `${wardInfo.area} (${wardInfo.zone})` : `Mathura Vrindavan Ward ${wardIndex}`;

            const staffInfo = STAFF_MAPPING[coreHlb] || STAFF_MAPPING[parseInt(coreHlb, 10).toString()];

            // Strict derived labels using Staff Mapping as primary fallback
            const supervisorName = String(row['Supervisor Name'] || row['Supervisor'] || (staffInfo ? staffInfo.supervisor : (wardInfo ? `Supervisor (Zone ${wardInfo.zone})` : `Supervisor (Ward ${wardIndex})`))).trim();
            const supervisorNumber = String(row['Supervisor Number'] || row['Supervisor Mobile'] || row['Supervisor Contact'] || (staffInfo ? staffInfo.supervisorMobile : '')).trim();
            const shortHlb = hlbIdVal.substring(hlbIdVal.length - 5) || hlbIdVal;
            const enumeratorName = String(row['Enumerator Name'] || row['Enumerator'] || (staffInfo ? staffInfo.enumerator : `Enumerator (Block ${shortHlb})`)).trim();
            const enumeratorNumber = String(row['Enumerator Number'] || row['Enumerator Mobile'] || row['Enumerator Contact'] || (staffInfo ? staffInfo.enumeratorMobile : '')).trim();
            
            const supervisorCircle = staffInfo?.supervisorCircle || '';
            const originalHlbCode = staffInfo?.originalHlbCode || coreHlb;
            const villageWard = staffInfo?.villageWard || '';

            // Resolve progress status flags
            let status = 'Yet To Start';
            if (parseInt(row['Completed']) === 1) {
              status = 'Completed';
            } else if (parseInt(row['In progress']) === 1) {
              status = 'In Progress';
            } else if (parseInt(row['Yet to start']) === 1) {
              status = 'Yet To Start';
            } else {
              const surveyed = parseInt(row['Total Number of Census Houses']) || 0;
              const expected = parseInt(row['Total Expected Census Houses']) || 0;
              if (surveyed > 0 && expected > 0) {
                status = surveyed >= expected ? 'Completed' : 'In Progress';
              }
            }

            processed.push({
              chargeId: standardChargeId,
              chargeName,
              hlbId: hlbIdVal,
              supervisorName,
              supervisorNumber,
              supervisorCircle,
              enumeratorName,
              enumeratorNumber,
              originalHlbCode,
              villageWard,
              expectedHouses: Math.max(0, parseInt(row['Total Expected Census Houses']) || 0),
              surveyedHouses: Math.max(0, parseInt(row['Total Number of Census Houses']) || 0),
              totalHouseholds: Math.max(0, parseInt(row['Total number of Households']) || 0),
              verifiedHouseholds: Math.max(0, parseInt(row['Households Verified By Supervisor']) || 0),
              totalPopulation: Math.max(0, parseInt(row['Total Population']) || 0),
              status,
              zone: wardInfo ? wardInfo.zone : 'Unknown',
              area: wardInfo ? wardInfo.area : 'Unknown',
              city: 'Mathura',
              ward: wardIndex,
              isChargeLevel: false,
              date: row['Refreshed Time'] || row['Refreshed Date'] || new Date().toISOString().split('T')[0]
            });
          });

          onDataLoaded(processed);
          setSuccessMsg(`Block-level census sheet loaded! Auto-processed ${processed.length} House Listing Blocks (HLBs).`);
          return;
        }

        if (isChargeSheet) {
          const processed = [];

          rows.forEach((row, idx) => {
            const chargeWiseVal = String(row['Charge Wise'] || '').trim();
            // Skip rows representing totals
            if (!chargeWiseVal ||
              chargeWiseVal.toLowerCase().includes('total') ||
              chargeWiseVal.startsWith('-') ||
              chargeWiseVal === ' - Total' ||
              chargeWiseVal === 'Total') {
              return;
            }

            let parsedChargeId = chargeWiseVal;
            let parsedChargeName = 'Unknown Area';

            if (chargeWiseVal.includes(' - ')) {
              const parts = chargeWiseVal.split(' - ');
              parsedChargeId = parts[0].trim();
              parsedChargeName = parts.slice(1).join(' - ').trim();
            }

            // Extract wardIndex from parsedChargeId using ward mapping
            const cleanCharge = parsedChargeId.replace(/[^0-9]/g, '');
            const wardIndex = parseInt(cleanCharge.substring(cleanCharge.length - 2), 10) || 1;
            const wardInfo = WARD_MAPPING[String(wardIndex)];

            const chargeId = parsedChargeId;
            const chargeName = wardInfo ? `${wardInfo.area} (${wardInfo.zone})` : parsedChargeName;

            // Strict derived labels instead of mock human names
            const supervisorName = wardInfo ? `Supervisor (Zone ${wardInfo.zone})` : `Supervisor (${parsedChargeId.substring(parsedChargeId.length - 6)})`;
            const enumeratorName = wardInfo ? `Field Team (Zone ${wardInfo.zone})` : `Field Team (${parsedChargeId.substring(parsedChargeId.length - 6)})`;

            processed.push({
              chargeId,
              chargeName,
              hlbId: `CH-${chargeId}`,
              supervisorName,
              enumeratorName,
              expectedHouses: Math.max(0, parseInt(row['Total Expected Census Houses']) || 0),
              surveyedHouses: Math.max(0, parseInt(row['Total Number of Census Houses']) || 0),
              totalHouseholds: Math.max(0, parseInt(row['Total number of Households']) || 0),
              verifiedHouseholds: Math.max(0, parseInt(row['Households Verified By Supervisor']) || 0),
              totalPopulation: Math.max(0, parseInt(row['Total Population']) || 0),

              totalHlbs: Math.max(0, parseInt(row['Total HLBs']) || 0),
              completedHlbs: Math.max(0, parseInt(row['Completed']) || 0),
              inProgressHlbs: Math.max(0, parseInt(row['In progress']) || 0),
              yetToStartHlbs: Math.max(0, parseInt(row['Yet to start']) || 0),

              status: 'In Progress',
              zone: wardInfo ? wardInfo.zone : 'Unknown',
              isChargeLevel: true,
              date: row['Refreshed Time'] || row['Refreshed Date'] || new Date().toISOString().split('T')[0]
            });
          });

          onDataLoaded(processed);
          setSuccessMsg(`Charge-level census sheet loaded! Auto-processed ${processed.length} administrative charges.`);
          return;
        }

        setFileHeaders(headers);
        setRawRows(rows);

        const initialMapping = detectMapping(headers);
        setMapping(initialMapping);

        // Check if auto-detect mapped everything successfully
        const missingFields = REQUIRED_FIELDS.filter(f => !initialMapping[f.key]);
        if (missingFields.length === 0) {
          // Auto-detection perfect! Process straight away
          const processed = processMappedData(rows, initialMapping);
          onDataLoaded(processed);
          setSuccessMsg(`File loaded successfully! Auto-mapped all ${headers.length} columns.`);
        } else {
          // Some fields missing, show Column Mapper
          setShowMapper(true);
        }
      } catch (err) {
        setError(`Failed to read file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleMapField = (key, val) => {
    setMapping(prev => ({ ...prev, [key]: val }));
  };

  const processMappedData = (rows, currentMapping) => {
    return rows.map((row, idx) => {
      // Map raw rows into uniform schema
      const statusRaw = row[currentMapping.status] ? String(row[currentMapping.status]).trim() : 'Yet To Start';
      let status = 'Yet To Start';
      if (statusRaw.toLowerCase().includes('complete') || statusRaw.toLowerCase() === 'done') status = 'Completed';
      else if (statusRaw.toLowerCase().includes('progress') || statusRaw.toLowerCase() === 'active') status = 'In Progress';

      const chargeIdVal = String(row[currentMapping.chargeId] || '').trim();
      const cleanCharge = chargeIdVal.replace(/[^0-9]/g, '');
      const wardIndex = parseInt(cleanCharge.substring(cleanCharge.length - 2), 10) || 1;
      const wardInfo = WARD_MAPPING[String(wardIndex)];

      return {
        chargeId: chargeIdVal,
        chargeName: String(row[currentMapping.chargeName] || (wardInfo ? `${wardInfo.area} (${wardInfo.zone})` : `Zone ${chargeIdVal}`)).trim(),
        hlbId: String(row[currentMapping.hlbId] || `HLB-${idx + 1000}`).trim(),
        supervisorName: String(row[currentMapping.supervisorName] || (wardInfo ? `Supervisor (Zone ${wardInfo.zone})` : 'Unknown Supervisor')).trim(),
        enumeratorName: String(row[currentMapping.enumeratorName] || 'Unknown Enumerator').trim(),
        expectedHouses: Math.max(0, parseInt(row[currentMapping.expectedHouses]) || 0),
        surveyedHouses: Math.max(0, parseInt(row[currentMapping.surveyedHouses]) || 0),
        totalPopulation: Math.max(0, parseInt(row[currentMapping.totalPopulation]) || 0),
        verifiedHouseholds: Math.max(0, parseInt(row[currentMapping.verifiedHouseholds]) || 0),
        status,
        zone: wardInfo ? wardInfo.zone : 'Unknown',
        date: row['Refreshed Time'] || row['Refreshed Date'] || row.date || new Date().toISOString().split('T')[0]
      };
    });
  };

  const handleApplyMapping = () => {
    // Validate mapping
    const missing = REQUIRED_FIELDS.filter(f => !mapping[f.key]);
    if (missing.length > 0) {
      setError(`Please map all columns: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    const processed = processMappedData(rawRows, mapping);
    onDataLoaded(processed);
    setSuccessMsg('Spreadsheet mapping configured successfully!');
    setShowMapper(false);
  };

  const downloadTemplate = () => {
    const headers = [
      'Charge ID', 'Charge Name', 'HLB ID', 'Supervisor Name', 'Enumerator Name',
      'Expected Houses', 'Surveyed Houses', 'Total Population', 'Verified Households', 'Status'
    ];
    const data = [
      headers,
      ['100000072160001', 'North Block A', 'HLB-1001', 'Supervisor (Ward 1)', 'Enumerator (Block 1001)', 180, 150, 630, 120, 'In Progress'],
      ['100000072160001', 'North Block A', 'HLB-1002', 'Supervisor (Ward 1)', 'Enumerator (Block 1002)', 200, 200, 880, 195, 'Completed'],
      ['100000072160002', 'South Ward 12', 'HLB-1003', 'Supervisor (Ward 2)', 'Enumerator (Block 1003)', 250, 50, 210, 20, 'In Progress'],
      ['100000072160002', 'South Ward 12', 'HLB-1004', 'Supervisor (Ward 2)', 'Enumerator (Block 1004)', 190, 0, 0, 0, 'Yet To Start']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Census Progress Template');
    XLSX.writeFile(wb, 'Janganana_Progress_Template.xlsx');
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Upper header information */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white">Census Progress Portal</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload block-level census logs (.csv or .xlsx) to evaluate operational coverage and detect non-working areas.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 dark:border-red-500/30">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600 dark:border-emerald-500/30">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {!showMapper ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Drag & Drop Zone */}
          <div className="md:col-span-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center transition hover:border-gov-400 dark:border-slate-800 dark:bg-slate-900">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gov-50 text-gov-600 dark:bg-gov-950/50 dark:text-gov-400">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mt-4 font-display text-base font-semibold text-slate-700 dark:text-white">
              Drag & drop census data
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Support Microsoft Excel (.xlsx, .xls) or CSV files
            </p>

            <button
              onClick={triggerFileSelect}
              className="mt-6 rounded-xl bg-gov-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-gov-500 transition"
            >
              Browse Files
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-display text-sm font-bold text-slate-800 dark:text-white">Excel Template</h4>
              <p className="mt-1 text-xs text-slate-400">
                Download a clean, structured progress template with all required columns.
              </p>
              <button
                onClick={downloadTemplate}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >
                <Download className="h-4 w-4 text-gold-500" />
                <span>Download Sample Sheet</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Column Mapper screen */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-slide-up">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Info className="h-6 w-6 text-gov-500" />
            <div>
              <h3 className="font-display text-base font-bold text-slate-800 dark:text-white">
                Map Spreadsheet Columns
              </h3>
              <p className="text-xs text-slate-400">
                Please match the spreadsheet columns to standard metrics for analytical calculations.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {REQUIRED_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{field.label}</span>
                  <p className="text-[10px] text-slate-400">{field.description}</p>
                </div>

                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => handleMapField(field.key, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-gov-500"
                >
                  <option value="">-- Choose Column --</option>
                  {fileHeaders.map((header, i) => (
                    <option key={i} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              onClick={() => setShowMapper(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyMapping}
              className="flex items-center gap-2 rounded-xl bg-gov-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-gov-500 transition"
            >
              <span>Apply & Process</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
