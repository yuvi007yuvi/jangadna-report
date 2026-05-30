// src/components/AiInsights.jsx
import React from 'react';
import { 
  BrainCircuit, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function AiInsights({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <BrainCircuit className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white">
            Janganana AI Insights Engine
          </h3>
          <span className="text-[10px] text-slate-400">
            Real-time operational suggestions and bottlenecks detected.
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Insights list */}
        <div className="md:col-span-2 space-y-4">
          {insights.map((insight, idx) => {
            let colorClass = 'border-l-blue-500 bg-blue-50/50 text-blue-900 border border-slate-100 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800';
            let Icon = Info;
            let title = 'General Status';

            if (insight.type === 'critical') {
              colorClass = 'border-l-red-500 bg-red-50/50 text-red-900 border border-red-100 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30';
              Icon = AlertOctagon;
              title = 'Critical Warning';
            } else if (insight.type === 'warning') {
              colorClass = 'border-l-amber-500 bg-amber-50/50 text-amber-900 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30';
              Icon = AlertTriangle;
              title = 'Attention Required';
            }

            return (
              <div 
                key={idx} 
                className={`flex gap-4 rounded-2xl border-l-4 p-5 shadow-sm transition ${colorClass}`}
              >
                <span className="mt-0.5 shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed font-semibold">{insight.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Recommendations Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-gold-500" />
            <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white">
              Recommended Actions
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1. Staff Deployment</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reassign 3 field agents from Completed zones to the lowest performing Charge to resolve bottlenecks.
              </p>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2. Quality Check Reminders</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automate SMS reminders to supervisors with &gt;100 pending household verifications.
              </p>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. Daily Targets</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Increase target field visits to at least 15 houses per day for In Progress enumerators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
