// src/components/CompletionPredictor.jsx
import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function CompletionPredictor({ predictor }) {
  if (!predictor) return null;

  // Let the user simulate deadline configurations
  const [targetDays, setTargetDays] = useState(30);
  const [extraStaff, setExtraStaff] = useState(0); // number of extra enumerators added

  const remainingHouses = predictor.remainingHouses;
  const currentDailyRate = predictor.dailySurveyRate || 10;
  
  // Calculate simulated rate
  // Let's assume each extra enumerator surveys 8 houses per day on average
  const simulatedDailyRate = currentDailyRate + (extraStaff * 8);
  const simulatedCompletionDays = simulatedDailyRate > 0 ? Math.ceil(remainingHouses / simulatedDailyRate) : 999;
  
  const simulatedCompletionDate = new Date();
  simulatedCompletionDate.setDate(simulatedCompletionDate.getDate() + simulatedCompletionDays);

  // Required target for target days input
  const remainingDays = Math.max(1, targetDays - predictor.daysElapsed);
  const requiredDailyTarget = Math.max(0, Math.ceil(remainingHouses / remainingDays));

  // Determine alert status
  const isLagging = simulatedCompletionDays > remainingDays;

  return (
    <div className="grid gap-6 p-6 md:grid-cols-3">
      {/* KPI Stats Panel */}
      <div className="md:col-span-2 space-y-6">
        {/* Core Predictions */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Card 1: Expected Completion */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-500/10 text-gov-600 dark:text-gov-400">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Projected Completion
                </span>
                <h4 className="font-display text-base font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {new Date(predictor.expectedCompletionDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </h4>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-500 dark:border-slate-850">
              <span>Time Remaining:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-350">{predictor.expectedCompletionDays} Days</span>
            </div>
          </div>

          {/* Card 2: Daily Target Required */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Pace / Target
                </span>
                <h4 className="font-display text-base font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {currentDailyRate.toFixed(1)} / {predictor.dailyRequiredTarget} <span className="text-[11px] font-normal text-slate-400">h/day</span>
                </h4>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-500 dark:border-slate-850">
              <span>Current rate status:</span>
              <span className={`font-semibold ${currentDailyRate >= predictor.dailyRequiredTarget ? 'text-emerald-600' : 'text-red-500'}`}>
                {currentDailyRate >= predictor.dailyRequiredTarget ? 'On Schedule' : 'Behind Pace'}
              </span>
            </div>
          </div>
        </div>

        {/* Workload details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-4">
            Remaining Project Scope
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Remaining Households</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-white">
                {predictor.remainingHouses.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Remaining HLBs</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-white">
                {predictor.remainingHlbs}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white mb-1">
            Predictive Simulation
          </h3>
          <p className="text-[10px] text-slate-400 mb-6">
            Adjust staff parameters and timelines to evaluate required targets.
          </p>

          <div className="space-y-5">
            {/* Target timeline slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Target Timeline:</span>
                <span className="text-gov-600 dark:text-gov-400">{targetDays} Days</span>
              </div>
              <input 
                type="range" 
                min={15} 
                max={60} 
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="mt-2 w-full accent-gov-600"
              />
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                <span>15 Days</span>
                <span>60 Days</span>
              </div>
            </div>

            {/* Extra Staff slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Deploy Additional Staff:</span>
                <span className="text-indigo-600 dark:text-indigo-400">+{extraStaff} Enumerators</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={15} 
                value={extraStaff}
                onChange={(e) => setExtraStaff(Number(e.target.value))}
                className="mt-2 w-full accent-indigo-600"
              />
              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                <span>Current Staff</span>
                <span>+15 Enumerators</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results of Simulation */}
        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Required Daily Pace:</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{requiredDailyTarget} houses/day</span>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Simulated Completion Date:</span>
            <span className="text-gov-600 dark:text-gov-400 font-bold">
              {simulatedCompletionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          {/* Alert pill */}
          <div className={`mt-2 flex items-center gap-2 rounded-lg p-2.5 text-[10px] font-bold uppercase tracking-wider ${
            isLagging 
              ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
          }`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {isLagging 
                ? 'Current pace will delay target completion' 
                : 'Projected completion is on schedule'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
