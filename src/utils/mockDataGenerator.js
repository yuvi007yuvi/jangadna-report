// src/utils/mockDataGenerator.js
import { WARD_MAPPING } from './wardMapping';
import { STAFF_MAPPING } from './staffMapping';
import realData from './realData.json';

export const generateMockCensusData = () => {
  const processed = [];

  realData.forEach((row) => {
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
      coreHlb = hlbIdVal.substring(15, 19);
    } else {
      let cleanHlb = hlbIdVal;
      if (cleanHlb.endsWith('00') && cleanHlb.length > 6) {
        cleanHlb = cleanHlb.slice(0, -2);
      }
      coreHlb = cleanHlb.slice(-4).padStart(4, '0');
    }

    let wardIndex = parseInt(coreHlb, 10);

    if (!wardIndex || !WARD_MAPPING[String(wardIndex)]) {
      const cleanWard = wardNoVal.replace(/[^0-9]/g, '');
      wardIndex = parseInt(cleanWard, 10) || 1;
    }

    const wardInfo = WARD_MAPPING[String(wardIndex)];
    const standardChargeId = `1000000721600` + String(wardIndex).padStart(2, '0');
    const chargeName = wardInfo ? `${wardInfo.area} (${wardInfo.zone})` : `Mathura Vrindavan Ward ${wardIndex}`;

    const staffInfo = STAFF_MAPPING[coreHlb] || STAFF_MAPPING[parseInt(coreHlb, 10).toString()];

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

  return processed;
};
