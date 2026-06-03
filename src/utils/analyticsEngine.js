// src/utils/analyticsEngine.js

export const computeAnalytics = (rawHlbData, capProgressAt100 = false) => {
  if (!rawHlbData || rawHlbData.length === 0) {
    return null;
  }

  // 1. Core aggregates
  const isChargeLevel = rawHlbData.some(row => row.isChargeLevel);
  let totalHlbs = isChargeLevel ? 0 : rawHlbData.length;
  let completedHlbs = 0;
  let inProgressHlbs = 0;
  let yetToStartHlbs = 0;

  let totalExpectedHouses = 0;
  let totalSurveyedHouses = 0;
  let totalPopulationCounted = 0;
  let totalVerifiedHouseholds = 0;
  let totalHouseholdsBase = 0;

  const progressBreakdown = {
    '0%': 0,
    '1-25%': 0,
    '26-50%': 0,
    '51-75%': 0,
    '76-99%': 0,
    '100%': 0,
    '>100%': 0
  };

  const uniqueCharges = new Set();
  const uniqueSupervisors = new Set();

  // Maps for group-by operations
  const chargeMap = {};
  const supervisorMap = {};

  rawHlbData.forEach(row => {
    // Standardize variables
    const expected = Number(row.expectedHouses) || 0;
    const surveyed = Number(row.surveyedHouses) || 0;
    const population = Number(row.totalPopulation) || 0;
    const verified = Number(row.verifiedHouseholds) || 0;
    const status = row.status || 'Yet To Start';

    totalExpectedHouses += expected;
    totalSurveyedHouses += surveyed;
    totalPopulationCounted += population;
    totalVerifiedHouseholds += verified;
    totalHouseholdsBase += isChargeLevel ? (Number(row.totalHouseholds) || 0) : surveyed;

    if (row.chargeId) uniqueCharges.add(row.chargeId);
    if (row.supervisorName) uniqueSupervisors.add(row.supervisorName);

    // Track status counts and progress breakdown
    if (isChargeLevel) {
      totalHlbs += Number(row.totalHlbs) || 0;
      completedHlbs += Number(row.completedHlbs) || 0;
      inProgressHlbs += Number(row.inProgressHlbs) || 0;
      yetToStartHlbs += Number(row.yetToStartHlbs) || 0;
    } else {
      if (status === 'Completed' || (surveyed >= expected && expected > 0)) {
        completedHlbs++;
      } else if (status === 'In Progress' || (surveyed > 0 && surveyed < expected)) {
        inProgressHlbs++;
      } else {
        yetToStartHlbs++;
      }

      // Progress breakdown
      let progressPercent = expected > 0 ? Math.round((surveyed / expected) * 100) : 0;
      if (capProgressAt100) progressPercent = Math.min(100, progressPercent);

      if (progressPercent === 0) progressBreakdown['0%']++;
      else if (progressPercent > 0 && progressPercent <= 25) progressBreakdown['1-25%']++;
      else if (progressPercent > 25 && progressPercent <= 50) progressBreakdown['26-50%']++;
      else if (progressPercent > 50 && progressPercent <= 75) progressBreakdown['51-75%']++;
      else if (progressPercent > 75 && progressPercent < 100) progressBreakdown['76-99%']++;
      else if (progressPercent === 100) progressBreakdown['100%']++;
      else if (progressPercent > 100) progressBreakdown['>100%']++;
    }

    // Aggregate Charge-wise
    if (row.chargeId) {
      if (!chargeMap[row.chargeId]) {
        chargeMap[row.chargeId] = {
          chargeId: row.chargeId,
          chargeName: row.chargeName || `Charge ${row.chargeId}`,
          expectedHouses: 0,
          surveyedHouses: 0,
          totalPopulation: 0,
          verifiedHouseholds: 0,
          totalHouseholds: 0,
          totalHlbs: 0,
          completedHlbs: 0,
          inProgressHlbs: 0,
          yetToStartHlbs: 0,
          supervisorName: row.supervisorName || 'N/A'
        };
      }
      const c = chargeMap[row.chargeId];
      c.expectedHouses += expected;
      c.surveyedHouses += surveyed;
      c.totalPopulation += population;
      c.verifiedHouseholds += verified;
      c.totalHouseholds += isChargeLevel ? (Number(row.totalHouseholds) || 0) : surveyed;
      
      if (isChargeLevel) {
        c.totalHlbs += Number(row.totalHlbs) || 0;
        c.completedHlbs += Number(row.completedHlbs) || 0;
        c.inProgressHlbs += Number(row.inProgressHlbs) || 0;
        c.yetToStartHlbs += Number(row.yetToStartHlbs) || 0;
      } else {
        c.totalHlbs++;
        if (status === 'Completed' || (surveyed >= expected && expected > 0)) c.completedHlbs++;
        else if (status === 'In Progress' || (surveyed > 0 && surveyed < expected)) c.inProgressHlbs++;
        else c.yetToStartHlbs++;
      }
    }

    // Aggregate Supervisor-wise
    if (row.supervisorName) {
      if (!supervisorMap[row.supervisorName]) {
        supervisorMap[row.supervisorName] = {
          name: row.supervisorName,
          totalHlbs: 0,
          completedHlbs: 0,
          inProgressHlbs: 0,
          yetToStartHlbs: 0,
          surveyedHouses: 0,
          verifiedHouseholds: 0,
          totalHouseholds: 0,
          expectedHouses: 0
        };
      }
      const s = supervisorMap[row.supervisorName];
      s.expectedHouses += expected;
      s.surveyedHouses += surveyed;
      s.verifiedHouseholds += verified;
      s.totalHouseholds += isChargeLevel ? (Number(row.totalHouseholds) || 0) : surveyed;
      
      if (isChargeLevel) {
        s.totalHlbs += Number(row.totalHlbs) || 0;
        s.completedHlbs += Number(row.completedHlbs) || 0;
        s.inProgressHlbs += Number(row.inProgressHlbs) || 0;
        s.yetToStartHlbs += Number(row.yetToStartHlbs) || 0;
      } else {
        s.totalHlbs++;
        if (status === 'Completed' || (surveyed >= expected && expected > 0)) s.completedHlbs++;
        else if (status === 'In Progress' || (surveyed > 0 && surveyed < expected)) s.inProgressHlbs++;
        else s.yetToStartHlbs++;
      }
    }
  });

  // Calculate high-level percentages
  const coveragePercent = totalExpectedHouses > 0 ? (totalSurveyedHouses / totalExpectedHouses) * 100 : 0;
  const completionPercent = totalHlbs > 0 ? (completedHlbs / totalHlbs) * 100 : 0;
  const verificationPercent = totalHouseholdsBase > 0 ? (totalVerifiedHouseholds / totalHouseholdsBase) * 100 : 0;

  // Process Charges list
  const chargesList = Object.values(chargeMap).map(c => {
    const coverage = c.expectedHouses > 0 ? (c.surveyedHouses / c.expectedHouses) * 100 : 0;
    const completion = c.totalHlbs > 0 ? (c.completedHlbs / c.totalHlbs) * 100 : 0;
    const verification = c.totalHouseholds > 0 ? (c.verifiedHouseholds / c.totalHouseholds) * 100 : 0;
    
    // Performance Status: Critical < 20%, Warning 20-40%, Good > 40%
    let performanceStatus = 'Good';
    if (coverage < 20) {
      performanceStatus = 'Critical';
    } else if (coverage < 40) {
      performanceStatus = 'Warning';
    }

    // Reasons for poor performance
    const reasons = [];
    if (coverage < 40) {
      if (c.surveyedHouses === 0) {
        reasons.push("Work has not started in the area");
      } else if (coverage < 20) {
        reasons.push("Low surveyed houses compared to targets");
      }
      const pending = c.expectedHouses - c.surveyedHouses;
      if (pending > c.expectedHouses * 0.6) {
        reasons.push("High number of pending/unvisited houses");
      }
      if (verification < 50 && c.totalHouseholds > 0) {
        reasons.push("Low supervisor verification / quality-check delay");
      }
    }

    return {
      ...c,
      coveragePercent: parseFloat(coverage.toFixed(2)),
      completionPercent: parseFloat(completion.toFixed(2)),
      verificationPercent: parseFloat(verification.toFixed(2)),
      performanceStatus,
      reasons
    };
  });

  // Process Supervisors list
  const supervisorsList = Object.values(supervisorMap).map(s => {
    const verification = s.totalHouseholds > 0 ? (s.verifiedHouseholds / s.totalHouseholds) * 100 : 0;
    const pendingHouses = s.totalHouseholds - s.verifiedHouseholds;
    const completion = s.totalHlbs > 0 ? (s.completedHlbs / s.totalHlbs) * 100 : 0;

    return {
      ...s,
      verificationPercent: parseFloat(verification.toFixed(2)),
      pendingHouses,
      completionPercent: parseFloat(completion.toFixed(2))
    };
  });

  // 2. Rankings
  const topCharges = [...chargesList].sort((a, b) => b.coveragePercent - a.coveragePercent);
  const bottomCharges = [...chargesList].sort((a, b) => a.coveragePercent - b.coveragePercent);

  // 3. Supervisor Lists
  // Best: Sorted by verification % descending and completed HLBs descending
  const bestSupervisors = [...supervisorsList].sort((a, b) => {
    if (b.verificationPercent === a.verificationPercent) {
      return b.completedHlbs - a.completedHlbs;
    }
    return b.verificationPercent - a.verificationPercent;
  });

  // Attention required: Sorted by verification % ascending and pending houses descending
  const attentionRequiredSupervisors = [...supervisorsList].sort((a, b) => {
    if (a.verificationPercent === b.verificationPercent) {
      return b.pendingHouses - a.pendingHouses;
    }
    return a.verificationPercent - b.verificationPercent;
  });

  // 4. Low Performance / "Not Working Properly" list
  const nonPerformingCharges = chargesList.filter(c => c.performanceStatus !== 'Good');

  // 5. Predictor Analytics
  const remainingHouses = totalExpectedHouses - totalSurveyedHouses;
  const remainingHlbs = totalHlbs - completedHlbs;
  
  // Calculate date span if present in data
  let daysElapsed = 10; // default fallback
  const dates = rawHlbData.map(d => d.date).filter(Boolean);
  if (dates.length > 1) {
    const parsedDates = dates.map(d => new Date(d).getTime());
    const minDate = Math.min(...parsedDates);
    const maxDate = Math.max(...parsedDates);
    const diff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    if (diff > 0) {
      daysElapsed = Math.ceil(diff);
    }
  }

  // Daily pace (surveyed houses per day)
  const dailySurveyRate = totalSurveyedHouses > 0 ? (totalSurveyedHouses / daysElapsed) : 15; // default rate if 0
  const expectedCompletionDays = dailySurveyRate > 0 ? Math.ceil(remainingHouses / dailySurveyRate) : 999;
  
  const expectedCompletionDate = new Date();
  expectedCompletionDate.setDate(expectedCompletionDate.getDate() + expectedCompletionDays);

  // Target requirement: Assume target of 30 days total. Remaining days:
  const plannedTotalDays = 30;
  const remainingTargetDays = Math.max(1, plannedTotalDays - daysElapsed);
  const dailyRequiredTarget = Math.ceil(remainingHouses / remainingTargetDays);

  // 6. Generate AI Insights
  const aiInsights = [];
  
  // Insight 1: Charge-level critical warnings
  const worstCharge = bottomCharges[0];
  if (worstCharge && worstCharge.coveragePercent < 30) {
    aiInsights.push({
      type: 'critical',
      message: `Charge "${worstCharge.chargeId} (${worstCharge.chargeName})" is lagging significantly with only ${worstCharge.coveragePercent}% coverage. Immediate deployment of extra enumerators is advised.`
    });
  }

  // Insight 2: Yet to Start Blocks
  if (yetToStartHlbs > 0) {
    aiInsights.push({
      type: 'warning',
      message: `${yetToStartHlbs} HLB${yetToStartHlbs > 1 ? 's' : ''} ${yetToStartHlbs > 1 ? 'are' : 'is'} yet to start and require${yetToStartHlbs > 1 ? '' : 's'} immediate attention.`
    });
  }

  // Insight 3: Supervisor Verification Lag
  const worstSupervisor = attentionRequiredSupervisors[0];
  if (worstSupervisor && worstSupervisor.verificationPercent < 60) {
    aiInsights.push({
      type: 'warning',
      message: `Supervisor verification under "${worstSupervisor.name}" is only ${worstSupervisor.verificationPercent}%, indicating potential quality-check delays or high pending verification backlogs (${worstSupervisor.pendingHouses} houses).`
    });
  }

  // Insight 4: General completion prediction
  if (expectedCompletionDays > 45) {
    aiInsights.push({
      type: 'info',
      message: `At the current average rate of ${dailySurveyRate.toFixed(1)} houses/day, the census will take an estimated ${expectedCompletionDays} more days to complete. To meet a 30-day timeline, you must increase the daily rate to ${dailyRequiredTarget} houses/day.`
    });
  } else {
    aiInsights.push({
      type: 'info',
      message: `At the current pace, the census project is projected to finish by ${expectedCompletionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${expectedCompletionDays} days remaining).`
    });
  }

  return {
    summary: {
      totalCharges: uniqueCharges.size,
      totalHlbs,
      completedHlbs,
      inProgressHlbs,
      yetToStartHlbs,
      expectedHouses: totalExpectedHouses,
      surveyedHouses: totalSurveyedHouses,
      coveragePercent: parseFloat(coveragePercent.toFixed(2)),
      completionPercent: parseFloat(completionPercent.toFixed(2)),
      totalPopulation: totalPopulationCounted,
      verifiedHouseholds: totalVerifiedHouseholds,
      verificationPercent: parseFloat(verificationPercent.toFixed(2)),
      progressBreakdown
    },
    chargesList,
    supervisorsList,
    rankings: {
      topCharges,
      bottomCharges
    },
    supervisorsRanked: {
      best: bestSupervisors,
      attention: attentionRequiredSupervisors
    },
    nonPerformingCharges,
    predictor: {
      remainingHouses,
      remainingHlbs,
      dailySurveyRate: parseFloat(dailySurveyRate.toFixed(2)),
      expectedCompletionDays,
      expectedCompletionDate: expectedCompletionDate.toISOString().split('T')[0],
      dailyRequiredTarget,
      daysElapsed
    },
    aiInsights
  };
};
