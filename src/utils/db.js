import localforage from 'localforage';

localforage.config({
  name: 'JangananaBureauDB',
  version: 1.0,
  storeName: 'census_snapshots',
  description: 'Daily snapshots of census field progress'
});

export const saveSnapshot = async (date, data, analytics) => {
  try {
    const payload = {
      date,
      savedAt: new Date().toISOString(),
      analytics,
      data // Store full dataset for potential future granular analysis
    };
    await localforage.setItem(date, payload);
    return true;
  } catch (err) {
    console.error('Failed to save snapshot:', err);
    return false;
  }
};

export const getAllSnapshots = async () => {
  try {
    const keys = await localforage.keys();
    const snapshots = [];
    for (const key of keys) {
      const val = await localforage.getItem(key);
      if (val && val.analytics) {
        snapshots.push(val);
      }
    }
    
    // Sort by actual parsed date
    return snapshots.sort((a, b) => {
      // Simple parse attempt for DD-MMM-YYYY or ISO
      return new Date(a.savedAt) - new Date(b.savedAt); 
    });
  } catch (err) {
    console.error('Failed to get snapshots:', err);
    return [];
  }
};

export const clearHistory = async () => {
  try {
    await localforage.clear();
    return true;
  } catch (err) {
    console.error('Failed to clear history:', err);
    return false;
  }
};
