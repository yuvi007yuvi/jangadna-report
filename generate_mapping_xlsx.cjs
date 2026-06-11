const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.resolve('new-maping of enumatars and supervisors .xlsx');
const workbook = xlsx.read(fs.readFileSync(excelPath), { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const mapping = {};
let currentSupervisor = '';
let currentSupervisorMobile = '';
let currentSupervisorCircle = '';

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;

  const hlbNo = row[1];
  if (!hlbNo) continue;

  const cleanHlb = String(hlbNo).trim().padStart(4, '0'); // ensure 4 digits if needed, wait, original script just did hlbNo.trim()

  let villageWard = (row[2] || '').toString().trim();
  let supervisorCircle = (row[6] || '').toString().trim();
  let supervisor = (row[7] || '').toString().trim();
  let supervisorMobile = (row[8] || '').toString().trim();
  let enumerator = (row[9] || '').toString().trim();
  let enumeratorMobile = (row[10] || '').toString().trim();

  // Forward fill supervisor details
  if (supervisor) {
    currentSupervisor = supervisor;
    currentSupervisorMobile = supervisorMobile;
    currentSupervisorCircle = supervisorCircle;
  } else {
    supervisor = currentSupervisor;
    supervisorMobile = currentSupervisorMobile;
    supervisorCircle = currentSupervisorCircle;
  }

  mapping[String(hlbNo).trim()] = {
    originalHlbCode: String(hlbNo).trim(),
    villageWard,
    supervisorCircle,
    supervisor,
    supervisorMobile,
    enumerator,
    enumeratorMobile
  };
}

const outPath = path.resolve('src/utils/staffMapping.js');
fs.writeFileSync(outPath, 'export const STAFF_MAPPING = ' + JSON.stringify(mapping, null, 2) + ';\n');
console.log('Mapping generated successfully with ' + Object.keys(mapping).length + ' entries.');
