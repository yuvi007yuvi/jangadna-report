// src/components/Sidebar.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  BarChart3, 
  TableProperties, 
  BrainCircuit, 
  CalendarDays,
  Moon, 
  Sun, 
  LogOut,
  FileSpreadsheet,
  AlertTriangle,
  X
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  toggleDarkMode, 
  onLogout,
  nonPerformingCount,
  hasData,
  isOpen,
  setIsOpen
}) {
  const menuItems = [
    { id: 'dashboard', name: 'Overview', icon: LayoutDashboard },
    { id: 'upload', name: 'File Upload', icon: UploadCloud },
    { id: 'charts', name: 'Visual Analytics', icon: BarChart3 },
    { id: 'tables', name: 'Rankings & Tables', icon: TableProperties },
    { id: 'predictions', name: 'Target Predictor', icon: CalendarDays },
    { id: 'insights', name: 'AI Insights Panel', icon: BrainCircuit },
  ];

  return (
    <aside className={`no-print fixed inset-y-0 left-0 z-50 lg:z-20 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-900">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="Janganana Logo" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="font-display text-sm font-bold leading-none text-gov-800 dark:text-white">JANGANANA</h1>
            <span className="text-[9px] font-semibold tracking-wider text-gold-600 dark:text-gold-400 block mt-1">ANALYTICS PORTAL</span>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden dark:hover:bg-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = !hasData && item.id !== 'upload';
          return (
            <button
              key={item.id}
              disabled={isLocked}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false); // Auto-close sidebar on mobile after clicking
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isLocked
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : isActive 
                    ? 'bg-gov-50 text-gov-600 dark:bg-gov-950/60 dark:text-gov-400' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white'
              }`}
              title={isLocked ? 'Please upload census data sheet first' : ''}
            >
              <Icon className={`h-5 w-5 ${isActive && !isLocked ? 'text-gov-500' : ''}`} />
              <span>{item.name}</span>
              
              {!isLocked && item.id === 'tables' && nonPerformingCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  {nonPerformingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-100 p-4 dark:border-slate-900">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white transition"
        >
          {darkMode ? (
            <>
              <Sun className="h-5 w-5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-slate-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10 transition"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
