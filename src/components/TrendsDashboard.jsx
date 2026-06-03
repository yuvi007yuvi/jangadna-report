import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { getAllSnapshots, clearHistory } from '../utils/db';
import * as XLSX from 'xlsx';

const TrendsDashboard = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await getAllSnapshots();
    
    // Format data for charts
    const chartData = data.map(snapshot => {
      // Handle missing analytics data safely
      const a = snapshot.analytics || {};
      
      // Parse the date to make it more chart friendly (e.g. "Jun 03")
      let shortDate = snapshot.date;
      try {
        if (snapshot.date.includes(',')) {
          const parts = snapshot.date.split(',');
          shortDate = parts[0].trim(); // Just grab the date part
        }
      } catch (e) {}

      return {
        fullDate: snapshot.date,
        date: shortDate,
        expectedHouses: a.totalExpectedHouses || 0,
        surveyedHouses: a.totalSurveyedHouses || 0,
        progress: a.overallProgress || 0,
        totalWards: a.totalWards || 0
      };
    });
    
    setHistory(chartData);
    setIsLoading(false);
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear all historical data? This cannot be undone.")) {
      await clearHistory();
      await loadHistory();
    }
  };

  const handleExportHistory = () => {
    if (history.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(history.map(item => ({
      'Date': item.fullDate,
      'Total Expected Houses': item.expectedHouses,
      'Total Surveyed Houses': item.surveyedHouses,
      'Overall Progress %': item.progress
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Progress History');
    XLSX.writeFile(workbook, `Census_Historical_Progress.xlsx`);
  };

  if (isLoading) {
    return <div className="flex justify-center p-12 text-slate-500">Loading historical data...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 text-slate-400">
          <TrendingUp className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">No Historical Data Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Every time you upload a census data file, a snapshot of your progress is saved automatically. 
          Upload a file to start tracking your daily trends!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gov-500" />
            Historical Progress Trends
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tracking {history.length} snapshot{history.length !== 1 ? 's' : ''} over time.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportHistory}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition"
          >
            <Download className="h-4 w-4" />
            Backup History
          </button>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium transition"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Cumulative Survey Progress</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSurveyed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickMargin={10} />
              <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="expectedHouses" name="Target Houses" stroke="#94a3b8" strokeDasharray="5 5" fill="none" strokeWidth={2} />
              <Area type="monotone" dataKey="surveyedHouses" name="Surveyed Houses" stroke="#10b981" fillOpacity={1} fill="url(#colorSurveyed)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Daily Snapshots</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold text-right">Target</th>
                <th className="py-3 px-4 font-semibold text-right">Completed</th>
                <th className="py-3 px-4 font-semibold text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {history.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {row.fullDate}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right font-mono">
                    {row.expectedHouses.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-emerald-600 dark:text-emerald-400 font-bold text-right font-mono">
                    {row.surveyedHouses.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300 text-right font-bold">
                    {row.progress}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default TrendsDashboard;
