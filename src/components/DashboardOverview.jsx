// src/components/DashboardOverview.jsx
import React from 'react';
import { 
  Building2, 
  Map, 
  CheckCircle2, 
  Activity, 
  Clock, 
  Home, 
  ClipboardCheck, 
  Percent, 
  Users, 
  ShieldCheck,
  AlertTriangle,
  PieChart,
  BarChart2
} from 'lucide-react';

export default function DashboardOverview({ summary, nonPerformingCount, setActiveTab }) {
  if (!summary) return null;

  const kpis = [
    {
      title: "Total Charges",
      value: summary.totalCharges,
      subtitle: "Administrative Zones",
      icon: Building2,
      color: "border-l-gov-500 text-gov-600 dark:text-gov-400 bg-gov-500/5",
    },
    {
      title: "Total HLBs",
      value: summary.totalHlbs,
      subtitle: "House Listing Blocks",
      icon: Map,
      color: "border-l-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5",
    },
    {
      title: "Completed HLBs",
      value: summary.completedHlbs,
      subtitle: `${summary.completionPercent}% Completion Rate`,
      icon: CheckCircle2,
      color: "border-l-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
      progress: summary.completionPercent
    },
    {
      title: "In Progress HLBs",
      value: summary.inProgressHlbs,
      subtitle: "Actively surveying blocks",
      icon: Activity,
      color: "border-l-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5",
    },
    {
      title: "Yet To Start HLBs",
      value: summary.yetToStartHlbs,
      subtitle: "Requires immediate start",
      icon: Clock,
      color: "border-l-slate-400 text-slate-600 dark:text-slate-400 bg-slate-500/5",
    },
    {
      title: "Expected Houses",
      value: summary.expectedHouses.toLocaleString('en-IN'),
      subtitle: "Target household count",
      icon: Home,
      color: "border-l-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5",
    },
    {
      title: "Surveyed Houses",
      value: summary.surveyedHouses.toLocaleString('en-IN'),
      subtitle: `${summary.coveragePercent}% of target`,
      icon: ClipboardCheck,
      color: "border-l-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5",
      progress: summary.coveragePercent
    },
    {
      title: "Coverage Rate",
      value: `${summary.coveragePercent}%`,
      subtitle: "Surveyed / Expected Houses",
      icon: Percent,
      color: "border-l-gold-500 text-gold-600 dark:text-gold-400 bg-gold-500/5",
      progress: summary.coveragePercent
    },
    {
      title: "Total Population",
      value: summary.totalPopulation.toLocaleString('en-IN'),
      subtitle: "Counted inhabitants",
      icon: Users,
      color: "border-l-teal-500 text-teal-600 dark:text-teal-400 bg-teal-500/5",
    },
    {
      title: "Verified Households",
      value: summary.verifiedHouseholds.toLocaleString('en-IN'),
      subtitle: `${summary.verificationPercent}% quality-checked`,
      icon: ShieldCheck,
      color: "border-l-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-600/5",
      progress: summary.verificationPercent
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Quick Alert Banner */}
      {nonPerformingCount > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-500/5 p-5 shadow-sm dark:border-red-500/30">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-red-800 dark:text-red-300">
                Action Required: {nonPerformingCount} Charges Flagged
              </h3>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">
                {nonPerformingCount} administrative charges are currently performing below target coverage (under 40%).
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('tables')}
            className="self-start rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 transition sm:self-center"
          >
            Review Exceptions
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`flex flex-col justify-between rounded-2xl border-l-4 border border-slate-100 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 ${kpi.color.split(' ')[0]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {kpi.title}
                  </span>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-slate-800 dark:text-white mt-1">
                    {kpi.value}
                  </h3>
                </div>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg p-2 ${kpi.color.split(' ').slice(2).join(' ')}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {kpi.subtitle}
                </span>
                {kpi.progress !== undefined && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                    <div 
                      className="h-1.5 rounded-full bg-gov-500 transition-all duration-500" 
                      style={{ width: `${Math.min(100, kpi.progress)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Analysis Dashboard */}
      {summary.progressBreakdown && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mt-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white">
                Completion Analysis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of enumerators by their current survey progress
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: 'Total Enumerators', value: summary.totalHlbs, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: '0%', value: summary.progressBreakdown['0%'], color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
              { label: '1 - 25%', value: summary.progressBreakdown['1-25%'], color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: '26 - 50%', value: summary.progressBreakdown['26-50%'], color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: '51 - 75%', value: summary.progressBreakdown['51-75%'], color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { label: '76 - 99%', value: summary.progressBreakdown['76-99%'], color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Exactly 100%', value: summary.progressBreakdown['100%'], color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Exceeded (>100%)', value: summary.progressBreakdown['>100%'], color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' }
            ].map((stat, idx) => (
              <div key={idx} className={`flex flex-col items-center justify-center rounded-xl p-4 text-center transition-transform hover:scale-105 ${stat.bg}`}>
                <span className={`text-3xl font-black ${stat.color}`}>
                  {stat.value}
                </span>
                <span className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {stat.label}
                </span>
                <span className="text-[10px] text-slate-400">Enumerators</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
