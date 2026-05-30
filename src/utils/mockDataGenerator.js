// src/utils/mockDataGenerator.js

const SUPERVISORS = [
  "Rajesh Kumar",
  "Anjali Sharma",
  "Amit Patel",
  "Sita Devi",
  "Karan Malhotra",
  "Priya Nair",
  "Vikram Singh",
  "Meera Joshi",
  "Sunil Verma",
  "Deepa Rao"
];

const ENUMERATORS = [
  "Rahul Gupta", "Sunita Sen", "Vijay Yadav", "Neha Roy",
  "Rohan Das", "Pooja Hegde", "Aman Verma", "Divya Teja",
  "Suresh Raina", "Geeta Phogat", "Mohit Sharma", "Kriti Sanon",
  "Ashok Leyland", "Nisha Patel", "Yash Birla", "Sneha Reddy"
];

const CHARGES = [
  { id: "100000072160001", name: "North Block A (Urban)" },
  { id: "100000072160002", name: "South Ward 12 (Suburban)" },
  { id: "100000072160003", name: "East Sector 4 (Urban)" },
  { id: "100000072160004", name: "West Block C (Rural)" },
  { id: "100000072160005", name: "Central Market Zone" },
  { id: "100000072160006", name: "Metro Terminal Area" },
  { id: "100000072160007", name: "River Bank Ward" },
  { id: "100000072160008", name: "Industrial Estate Sector" },
  { id: "100000072160009", name: "Hill View Ward 3" },
  { id: "100000072160010", name: "Forest Buffer Zone" }
];

export const generateMockCensusData = () => {
  const data = [];
  let hlbCounter = 1001;

  // Let's create about 6 to 10 HLBs per charge
  CHARGES.forEach((charge, chargeIdx) => {
    // Determine supervisor for this charge
    const supervisor = SUPERVISORS[chargeIdx % SUPERVISORS.length];
    
    // We want some charges to be critical, warnings, or good
    // Charge 1 (idx 0): Critical coverage (< 20%)
    // Charge 2 (idx 1): Warning coverage (20% to 40%)
    // Charge 5 (idx 4): Very low supervisor verification (Attention required)
    // Others: Good (> 40%)
    
    let hlbCount = 7 + (chargeIdx % 4); // 7 to 10 HLBs per charge

    for (let idx = 0; idx < hlbCount; idx++) {
      const hlbId = `HLB-${hlbCounter++}`;
      const enumerator = ENUMERATORS[(chargeIdx * 3 + idx) % ENUMERATORS.length];
      
      let expectedHouses = 180 + (idx * 15) - (chargeIdx * 5);
      let surveyedHouses = 0;
      let verifiedHouseholds = 0;
      let status = "Yet To Start";
      let totalPopulation = 0;

      if (chargeIdx === 0) {
        // Critical: low coverage (e.g. total under 20%)
        const randomSeed = Math.random();
        if (randomSeed < 0.2) {
          status = "In Progress";
          surveyedHouses = Math.floor(expectedHouses * 0.18);
          totalPopulation = Math.floor(surveyedHouses * 4.3);
          verifiedHouseholds = Math.floor(surveyedHouses * 0.4); // low verification
        } else {
          status = "Yet To Start";
        }
      } else if (chargeIdx === 1) {
        // Warning: coverage between 20% and 40%
        const randomSeed = Math.random();
        if (randomSeed < 0.6) {
          status = "In Progress";
          surveyedHouses = Math.floor(expectedHouses * 0.38);
          totalPopulation = Math.floor(surveyedHouses * 4.5);
          verifiedHouseholds = Math.floor(surveyedHouses * 0.5);
        } else {
          status = "Yet To Start";
        }
      } else if (chargeIdx === 4) {
        // Attention Required: Low verification (low supervisor quality-checks)
        status = "In Progress";
        surveyedHouses = Math.floor(expectedHouses * 0.75);
        totalPopulation = Math.floor(surveyedHouses * 4.1);
        verifiedHouseholds = Math.floor(surveyedHouses * 0.25); // only 25% verified
      } else {
        // Good charges (Progressing normally or completed)
        const randomSeed = Math.random();
        if (randomSeed < 0.3) {
          status = "Completed";
          surveyedHouses = expectedHouses;
          totalPopulation = Math.floor(surveyedHouses * 4.4);
          verifiedHouseholds = Math.floor(surveyedHouses * 0.95); // 95% verified
        } else if (randomSeed < 0.8) {
          status = "In Progress";
          surveyedHouses = Math.floor(expectedHouses * 0.65);
          totalPopulation = Math.floor(surveyedHouses * 4.2);
          verifiedHouseholds = Math.floor(surveyedHouses * 0.85);
        } else {
          status = "Yet To Start";
        }
      }

      data.push({
        hlbId,
        chargeId: charge.id,
        chargeName: charge.name,
        supervisorName: supervisor,
        enumeratorName: enumerator,
        expectedHouses,
        surveyedHouses,
        totalPopulation,
        verifiedHouseholds,
        status,
        date: new Date(Date.now() - (idx * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // last active days
      });
    }
  });

  return data;
};
