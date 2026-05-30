// src/components/VisualCharts.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line
} from 'recharts';

export default function VisualCharts({ data, summary, chargesList }) {
  if (!data || !summary || !chargesList) return null;

  // Colors for performance tiers
  const PERFORMANCE_COLORS = {
    Critical: '#ef4444', // Red
    Warning: '#eab308',  // Yellow
    Good: '#10b981'      // Green
  };

  // Pie chart data
  const pieData = [
    { name: 'Completed HLBs', value: summary.completedHlbs, color: '#10b981' },
    { name: 'In Progress HLBs', value: summary.inProgressHlbs, color: '#f59e0b' },
    { name: 'Yet To Start HLBs', value: summary.yetToStartHlbs, color: '#94a3b8' }
  ];

  // Custom tooltips
  const percentFormatter = (value) => `${value.toFixed(2)}%`;
  const numberFormatter = (value) => value.toLocaleString('en-IN');

  return (
    <div className="space-y-8 p-6">
      {/* Upper Grid: 1. Coverage Bar & 4. HLB Completion Pie */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Coverage Bar Chart */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-4">
            1. Coverage Bar Chart (% per Charge)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargesList} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="chargeId" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={percentFormatter} 
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="coveragePercent" name="Coverage Rate">
                  {chargesList.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PERFORMANCE_COLORS[entry.performanceStatus]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500 dark:text-slate-400">On Track (&gt;40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-slate-500 dark:text-slate-400">Warning (20%-40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-slate-500 dark:text-slate-400">Critical (&lt;20%)</span>
            </div>
          </div>
        </div>

        {/* HLB Completion Doughnut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-4">
            4. HLB Completion Status
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-slate-800 dark:text-white">{item.value} Blocks</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Grid: 2. Charge-wise Progress & 5. Verification Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Charge-wise progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-4">
            2. Charge-wise progress (Expected vs Surveyed Houses)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargesList} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="chargeId" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={numberFormatter} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="expectedHouses" name="Expected Houses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="surveyedHouses" name="Surveyed Houses" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-4">
            5. Verification Status (Total Households vs Verified)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargesList} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="chargeId" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={numberFormatter} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalHouseholds" name="Total Households" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="verifiedHouseholds" name="Verified Households" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: 3. Population Distribution & 6. Heatmap Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Population Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-4">
            3. Population Distribution Chart
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chargesList} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="chargeId" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={numberFormatter} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="totalPopulation" 
                  name="Population Counted" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Heatmap grid showing low-performing charges */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white">
              6. Performance Heatmap (Low Coverage Alerts)
            </h3>
            <span className="text-[11px] text-slate-400">
              Interactive grid visualizing progress status. Click/hover over cells for details.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {chargesList.map((charge, idx) => {
              let bg = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
              let tag = 'Good';
              if (charge.performanceStatus === 'Critical') {
                bg = 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900';
                tag = 'Critical';
              } else if (charge.performanceStatus === 'Warning') {
                bg = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
                tag = 'Warning';
              }

              return (
                <div 
                  key={idx}
                  className={`group relative rounded-xl border p-4 transition-all hover:scale-105 hover:shadow ${bg}`}
                >
                  <div className="text-[10px] font-bold tracking-widest opacity-60">
                    {charge.chargeId.substring(charge.chargeId.length - 6)}
                  </div>
                  <h4 className="mt-1 font-display text-xs font-bold leading-tight line-clamp-1">
                    {charge.chargeName}
                  </h4>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-lg font-extrabold">{charge.coveragePercent}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">
                      {tag}
                    </span>
                  </div>

                  {/* Heatmap Cell Tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded-xl bg-slate-950 p-3 text-[11px] text-slate-300 opacity-0 shadow-xl transition-opacity duration-200 border border-slate-800 group-hover:opacity-100">
                    <h5 className="font-bold text-white mb-1.5">{charge.chargeName}</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Expected Houses:</span>
                        <span className="font-semibold text-white">{charge.expectedHouses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Surveyed Houses:</span>
                        <span className="font-semibold text-white">{charge.surveyedHouses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification Rate:</span>
                        <span className="font-semibold text-white">{charge.verificationPercent}%</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1 mt-1 text-[10px]">
                        <span>Supervisor:</span>
                        <span className="font-semibold text-gold-400">{charge.supervisorName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
