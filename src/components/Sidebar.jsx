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
  X,
  Contact2,
  ChevronLeft
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
  setIsOpen,
  isCollapsed,
  setIsCollapsed
}) {
  const menuItems = [
    { id: 'dashboard', name: 'Overview', icon: LayoutDashboard },
    { id: 'upload', name: 'File Upload', icon: UploadCloud },
    { id: 'charts', name: 'Visual Analytics', icon: BarChart3 },
    { id: 'tables', name: 'Rankings & Tables', icon: TableProperties },
    { id: 'predictions', name: 'Target Predictor', icon: CalendarDays },
    { id: 'insights', name: 'AI Insights Panel', icon: BrainCircuit },
    { id: 'contacts', name: 'Field Contacts', icon: Contact2 },
    { id: 'supervisorValidation', name: 'Supervisor Validation', icon: FileSpreadsheet },
  ];

  return (
    <aside className={`no-print fixed inset-y-0 left-0 z-50 lg:z-20 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 ${
      isOpen ? 'translate-x-0 w-64' : `-translate-x-full lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`
    }`}>
      {/* Brand Header */}
      <div className={`flex h-20 items-center border-b border-slate-100 dark:border-slate-900 relative ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
          <img src={logoImg} alt="Janganana Logo" className="h-12 w-12 object-contain shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-display text-sm font-bold leading-none text-gov-800 dark:text-white">JANGANANA</h1>
              <span className="text-[9px] font-semibold tracking-wider text-gold-600 dark:text-gold-400 block mt-1">ANALYTICS PORTAL</span>
            </div>
          )}
        </div>
        
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex absolute -right-3 top-7 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden dark:hover:bg-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 space-y-1 py-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
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
              className={`flex w-full items-center rounded-xl transition ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} text-sm font-medium ${
                isLocked
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : isActive 
                    ? 'bg-gov-50 text-gov-600 dark:bg-gov-950/60 dark:text-gov-400' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white'
              }`}
              title={isLocked ? 'Please upload census data sheet first' : item.name}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive && !isLocked ? 'text-gov-500' : ''}`} />
              
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              
              {!isLocked && item.id === 'tables' && nonPerformingCount > 0 && !isCollapsed && (
                <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  {nonPerformingCount}
                </span>
              )}
              
              {!isLocked && item.id === 'tables' && nonPerformingCount > 0 && isCollapsed && (
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`border-t border-slate-100 p-4 dark:border-slate-900 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={`flex w-full items-center rounded-xl transition ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white`}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            <>
              <Sun className="h-5 w-5 shrink-0 text-amber-500" />
              {!isCollapsed && <span className="truncate">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 shrink-0 text-slate-600" />
              {!isCollapsed && <span className="truncate">Dark Mode</span>}
            </>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className={`mt-1 flex w-full items-center rounded-xl transition ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} text-sm font-medium text-red-500 hover:bg-red-50 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10`}
          title="Sign Out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
