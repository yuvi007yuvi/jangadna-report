// src/utils/reportExporter.js
import * as XLSX from 'xlsx';

export const exportPerformanceExcel = (analytics, type) => {
  if (!analytics) return;

  const wb = XLSX.utils.book_new();

  if (type === 'performance' || type === 'all') {
    // 1. Charge-wise Performance Sheet
    const chargeData = analytics.chargesList.map(c => ({
      'Charge ID': c.chargeId,
      'Charge Name': c.chargeName,
      'Supervisor Name': c.supervisorName,
      'Expected Houses': c.expectedHouses,
      'Surveyed Houses': c.surveyedHouses,
      'Coverage %': c.coveragePercent,
      'Total Population': c.totalPopulation,
      'Verified Households': c.verifiedHouseholds,
      'Verification %': c.verificationPercent,
      'Completed HLBs': c.completedHlbs,
      'Total HLBs': c.totalHlbs,
      'Performance': c.performanceStatus
    }));

    const wsCharge = XLSX.utils.json_to_sheet(chargeData);
    XLSX.utils.book_append_sheet(wb, wsCharge, 'Charge Performance');
  }

  if (type === 'supervisor' || type === 'all') {
    // 2. Supervisor Performance Sheet
    const supervisorData = analytics.supervisorsList.map(s => ({
      'Supervisor Name': s.name,
      'Total HLBs': s.totalHlbs,
      'Completed HLBs': s.completedHlbs,
      'In Progress HLBs': s.inProgressHlbs,
      'Yet To Start': s.yetToStartHlbs,
      'Expected Houses': s.expectedHouses,
      'Surveyed Houses': s.surveyedHouses,
      'Verified Households': s.verifiedHouseholds,
      'Verification %': s.verificationPercent,
      'Pending Verification': s.pendingHouses
    }));

    const wsSupervisor = XLSX.utils.json_to_sheet(supervisorData);
    XLSX.utils.book_append_sheet(wb, wsSupervisor, 'Supervisor Performance');
  }

  if (type === 'non_performing' || type === 'all') {
    // 3. Non Performing Charges Sheet
    const nonPerfData = analytics.nonPerformingCharges.map(c => ({
      'Charge ID': c.chargeId,
      'Charge Name': c.chargeName,
      'Supervisor Name': c.supervisorName,
      'Coverage %': c.coveragePercent,
      'Expected Houses': c.expectedHouses,
      'Surveyed Houses': c.surveyedHouses,
      'Pending Houses': c.expectedHouses - c.surveyedHouses,
      'Verification %': c.verificationPercent,
      'Status': c.performanceStatus,
      'Reasons': c.reasons.join('; ')
    }));

    const wsNonPerf = XLSX.utils.json_to_sheet(nonPerfData);
    XLSX.utils.book_append_sheet(wb, wsNonPerf, 'Lagging Charges');
  }

  // File download name based on type
  let filename = 'Janganana_Census_Report.xlsx';
  if (type === 'performance') filename = 'Janganana_Charge_Performance.xlsx';
  if (type === 'supervisor') filename = 'Janganana_Supervisor_Performance.xlsx';
  if (type === 'non_performing') filename = 'Janganana_Lagging_Charges_Alert.xlsx';

  XLSX.writeFile(wb, filename);
};

export const triggerPdfPrint = () => {
  window.print();
};
