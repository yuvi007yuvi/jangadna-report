const fs = require('fs');
const path = require('path');
const csvPath = path.resolve('maping sheet.csv');
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split('\n');
const mapping = {};

let currentSupervisor = '';
let currentSupervisorMobile = '';
let currentSupervisorCircle = '';

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const cols = [];
  let inQuotes = false;
  let current = '';
  for (let char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { cols.push(current); current = ''; }
    else current += char;
  }
  cols.push(current);

  const hlbNo = cols[1];
  if (!hlbNo) continue;
  
  const cleanHlb = hlbNo.trim();
  
  let villageWard = (cols[2] || '').trim();
  let supervisorCircle = (cols[6] || '').trim();
  let supervisor = (cols[7] || '').trim();
  let supervisorMobile = (cols[8] || '').trim();
  let enumerator = (cols[9] || '').trim();
  let enumeratorMobile = (cols[10] || '').trim();

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
  
  mapping[cleanHlb] = {
    originalHlbCode: hlbNo.trim(),
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
