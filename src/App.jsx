// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  FileSpreadsheet, 
  FileDown, 
  User, 
  Check, 
  Lock,
  Menu,
  Shield,
  HelpCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import DashboardOverview from './components/DashboardOverview';
import VisualCharts from './components/VisualCharts';
import PerformanceTables from './components/PerformanceTables';
import CompletionPredictor from './components/CompletionPredictor';
import AiInsights from './components/AiInsights';
import AdminLogin from './components/AdminLogin';
import ContactReport from './components/ContactReport';
import TrendsDashboard from './components/TrendsDashboard';
import SupervisorValidation from './components/SupervisorValidation';
import { saveSnapshot } from './utils/db';

import { generateMockCensusData } from './utils/mockDataGenerator';
import { computeAnalytics } from './utils/analyticsEngine';
import { exportPerformanceExcel, triggerPdfPrint } from './utils/reportExporter';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  
  const [rawCensusData, setRawCensusData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [capProgressAt100, setCapProgressAt100] = useState(false);
  
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }));

  // Filters State
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [selectedChargeFilter, setSelectedChargeFilter] = useState('');
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Recompute analytics when cap setting changes
  useEffect(() => {
    if (rawCensusData.length > 0) {
      setAnalytics(computeAnalytics(rawCensusData, capProgressAt100));
    }
  }, [capProgressAt100, rawCensusData]);

  const handleLoadMockData = () => {
    const data = generateMockCensusData();
    // Since mock data generator doesn't use the mapping, let's map zones dynamically in App.jsx for mock data
    const dataWithMappedZones = data.map(item => {
      const cleanCharge = item.chargeId.replace(/[^0-9]/g, '');
      const wardIndex = parseInt(cleanCharge.substring(cleanCharge.length - 2), 10) || 1;
      const wardInfo = {
        "1": "Z3-C1", "2": "Z1-C1", "3": "Z2-C1", "4": "Z1-C1", "5": "Z1-C1",
        "6": "Z3-C1", "7": "Z1-C1", "8": "Z4-C1", "9": "Z4-C1", "10": "Z3-C1"
      }[String(wardIndex)] || "Unknown";
      return {
        ...item,
        zone: item.zone || wardInfo,
        // Replace mock names in demo data to avoid mock names violations
        supervisorName: `Supervisor (Zone ${item.zone || wardInfo})`,
        enumeratorName: `Enumerator (Block ${item.hlbId.substring(item.hlbId.length - 4)})`
      };
    });
    setRawCensusData(dataWithMappedZones);
    const results = computeAnalytics(dataWithMappedZones, capProgressAt100);
    setAnalytics(results);
    setSelectedZoneFilter('');
    setSelectedChargeFilter('');
    setSelectedSupervisorFilter('');
    setSelectedStatusFilter('');
    setActiveTab('dashboard');
    setLastUpdated(new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }));
  };

  const handleDataUploaded = (processedData) => {
    setRawCensusData(processedData);
    const results = computeAnalytics(processedData, capProgressAt100);
    setAnalytics(results);
    setActiveTab('dashboard');
    setSelectedZoneFilter('');
    setSelectedChargeFilter('');
    setSelectedSupervisorFilter('');
    setSelectedStatusFilter('');
    
    const fileTime = processedData.length > 0 && processedData[0].date 
      ? processedData[0].date 
      : new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      
    setLastUpdated(fileTime);
    
    // Save snapshot to local database for trend analysis
    saveSnapshot(fileTime, processedData, results).catch(console.error);
  };

  // Filter application
  const getFilteredData = () => {
    if (!rawCensusData) return [];
    return rawCensusData.filter(item => {
      const matchZone = !selectedZoneFilter || item.zone === selectedZoneFilter;
      const matchCharge = !selectedChargeFilter || item.chargeId === selectedChargeFilter;
      const matchSupervisor = !selectedSupervisorFilter || item.supervisorName === selectedSupervisorFilter;
      const matchStatus = !selectedStatusFilter || item.status === selectedStatusFilter;
      return matchZone && matchCharge && matchSupervisor && matchStatus;
    });
  };

  // Re-run analytics when filters change
  const filteredData = getFilteredData();
  const currentAnalytics = computeAnalytics(filteredData) || analytics;

  // Extract unique filter dropdown values from raw data
  const zonesOptions = Array.from(new Set(rawCensusData.map(d => d.zone).filter(Boolean))).sort();

  const filteredForDropdowns = selectedZoneFilter 
    ? rawCensusData.filter(d => d.zone === selectedZoneFilter) 
    : rawCensusData;

  const chargesOptions = Array.from(new Set(filteredForDropdowns.map(d => d.chargeId)))
    .map(id => ({ id, name: filteredForDropdowns.find(d => d.chargeId === id)?.chargeName || id }));

  const supervisorsOptions = Array.from(new Set(filteredForDropdowns.map(d => d.supervisorName)));

  // Reports Trigger handler
  const handleExportReport = (reportType) => {
    setShowReportsDropdown(false);
    if (!currentAnalytics) return;

    if (reportType === 'pdf') {
      triggerPdfPrint();
    } else {
      exportPerformanceExcel(currentAnalytics, reportType);
    }
  };

  // Notification Trigger
  const getCriticalNotificationCount = () => {
    if (!currentAnalytics) return 0;
    let count = currentAnalytics.nonPerformingCharges.length;
    if (currentAnalytics.summary.yetToStartHlbs > 0) count++;
    return count;
  };

  if (!isLoggedIn && showLoginModal) {
    return <AdminLogin onLoginSuccess={() => { setIsLoggedIn(true); setShowLoginModal(false); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-200 print:bg-white print:text-black print:block">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        onLogout={() => { setIsLoggedIn(false); setRawCensusData([]); setAnalytics(null); setActiveTab('upload'); }}
        nonPerformingCount={analytics?.nonPerformingCharges.length || 0}
        hasData={rawCensusData.length > 0}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={desktopSidebarCollapsed}
        setIsCollapsed={setDesktopSidebarCollapsed}
      />

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden no-print"
        />
      )}

      {/* Main Panel Shell */}
      <div className={`pl-0 ${desktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-h-screen transition-all duration-300 print:block print:pl-0 print:min-h-0`}>
        
        {/* Top Navigation Bar */}
        <header className="no-print sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          
          {/* Ministry / Country Flag Details */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 transition lg:hidden mr-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Tricolour vertical strip */}
            <div className="flex h-8 w-1 flex-col overflow-hidden rounded-full shrink-0">
              <div className="flex-1 bg-[#FF9933]"></div>
              <div className="flex-1 bg-white"></div>
              <div className="flex-1 bg-[#128807]"></div>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Government of India • Janganana Bureau
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <h2 className="font-display text-sm font-bold text-slate-850 dark:text-slate-200 leading-none">
                  National Census Performance System
                </h2>
                <span className="hidden lg:inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Last Updated: {lastUpdated}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-4">
            
            {/* Filter Pills Alert */}
            {rawCensusData.length > 0 && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-gov-50 px-3 py-1 text-xs font-semibold text-gov-600 dark:bg-gov-950/40 dark:text-gov-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Active Sheet: {rawCensusData.length} HLBs Loaded</span>
              </span>
            )}

            {/* Reports Download Center */}
            <div className="relative">
              <button
                onClick={() => setShowReportsDropdown(!showReportsDropdown)}
                className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 py-2 px-4 text-xs font-semibold text-slate-700 transition dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FileDown className="h-4 w-4 text-gov-500" />
                <span>Export Report</span>
              </button>

              {showReportsDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-slide-up">
                  <span className="block px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                    Select Download Format
                  </span>
                  
                  <button 
                    onClick={() => handleExportReport('pdf')} 
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    <span>📄</span> Executive PDF Summary
                  </button>
                  <button 
                    onClick={() => handleExportReport('performance')} 
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    <span>📊</span> Charge Performance Excel
                  </button>
                  <button 
                    onClick={() => handleExportReport('supervisor')} 
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    <span>👥</span> Supervisor Performance Excel
                  </button>
                  <button 
                    onClick={() => handleExportReport('non_performing')} 
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    <span>⚠️</span> Non-Performing Charges Report
                  </button>
                  <button 
                    onClick={() => handleExportReport('all')} 
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    <span>📦</span> Master Data Workbook (All Sheets)
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <Bell className="h-5 w-5" />
                {getCriticalNotificationCount() > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-slide-up">
                  <div className="px-4 border-b border-slate-100 dark:border-slate-850 pb-2 mb-2">
                    <h4 className="font-display text-xs font-bold text-slate-800 dark:text-white">Alert Notifications</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto px-2 space-y-1">
                    {currentAnalytics?.nonPerformingCharges.slice(0, 3).map((c, i) => (
                      <div key={i} className="rounded-lg p-2.5 bg-red-50/50 dark:bg-red-950/20 text-[11px]">
                        <span className="font-bold text-red-700 dark:text-red-400">Critical Alert</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">Charge {c.chargeId} has low coverage of {c.coveragePercent}%.</p>
                      </div>
                    ))}
                    {currentAnalytics?.summary.yetToStartHlbs > 0 && (
                      <div className="rounded-lg p-2.5 bg-amber-50/50 dark:bg-amber-950/20 text-[11px]">
                        <span className="font-bold text-amber-700 dark:text-amber-400">Warning Alert</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{currentAnalytics.summary.yetToStartHlbs} HLBs yet to start operations.</p>
                      </div>
                    )}
                    {getCriticalNotificationCount() === 0 && (
                      <p className="text-center py-4 text-xs text-slate-400">No alerts triggered. System is on track.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Check */}
            {!isLoggedIn ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gov-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-gov-500 transition"
              >
                <Lock className="h-4 w-4" />
                <span>Admin Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 py-1.5 px-3.5 text-xs text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="font-bold">Admin Mode</span>
              </div>
            )}
          </div>
        </header>

        {/* Global Dashboard Filters Bar */}
        {activeTab !== 'upload' && activeTab !== 'insights' && activeTab !== 'contacts' && (
          <div className="no-print mx-6 mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>
            
            {/* Filter by Zone */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Zone:</span>
              <select
                value={selectedZoneFilter}
                onChange={(e) => {
                  setSelectedZoneFilter(e.target.value);
                  setSelectedChargeFilter('');
                  setSelectedSupervisorFilter('');
                }}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1 px-2 text-xs outline-none transition focus:border-gov-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 focus:ring-1 focus:ring-gov-500"
              >
                <option value="">All Zones</option>
                {zonesOptions.map((zone, i) => (
                  <option key={i} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Filter by Charge */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Charge:</span>
              <select
                value={selectedChargeFilter}
                onChange={(e) => setSelectedChargeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1 px-2 text-xs outline-none transition focus:border-gov-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 focus:ring-1 focus:ring-gov-500"
              >
                <option value="">All Charges</option>
                {chargesOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id.substring(c.id.length - 6)})</option>
                ))}
              </select>
            </div>

            {/* Filter by Supervisor */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Supervisor:</span>
              <select
                value={selectedSupervisorFilter}
                onChange={(e) => setSelectedSupervisorFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1 px-2 text-xs outline-none transition focus:border-gov-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 focus:ring-1 focus:ring-gov-500"
              >
                <option value="">All Supervisors</option>
                {supervisorsOptions.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Progress Status */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Progress Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 py-1 px-2 text-xs outline-none transition focus:border-gov-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 focus:ring-1 focus:ring-gov-500"
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Yet To Start">Yet To Start</option>
              </select>
            </div>

            {/* Reset Button */}
            {(selectedZoneFilter || selectedChargeFilter || selectedSupervisorFilter || selectedStatusFilter) && (
              <button
                onClick={() => {
                  setSelectedZoneFilter('');
                  setSelectedChargeFilter('');
                  setSelectedSupervisorFilter('');
                  setSelectedStatusFilter('');
                }}
                className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Tab Panel View Router */}
        <main className="flex-1 pb-16 print:block print:pb-0">
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              summary={currentAnalytics?.summary} 
              nonPerformingCount={currentAnalytics?.nonPerformingCharges.length || 0}
              setActiveTab={setActiveTab}
              capProgressAt100={capProgressAt100}
              setCapProgressAt100={setCapProgressAt100}
            />
          )}

          {activeTab === 'upload' && (
            <FileUpload 
              onDataLoaded={handleDataUploaded}
              onLoadDemoData={handleLoadMockData}
            />
          )}

          {activeTab === 'charts' && (
            <VisualCharts 
              data={filteredData}
              summary={currentAnalytics?.summary}
              chargesList={currentAnalytics?.chargesList}
            />
          )}

          {activeTab === 'tables' && (
            <PerformanceTables 
              filteredData={filteredData}
              chargesList={currentAnalytics?.chargesList}
              supervisorsList={currentAnalytics?.supervisorsList}
              rankings={currentAnalytics?.rankings}
              supervisorsRanked={currentAnalytics?.supervisorsRanked}
              nonPerformingCharges={currentAnalytics?.nonPerformingCharges}
            />
          )}

          {activeTab === 'predictions' && (
            <CompletionPredictor 
              predictor={currentAnalytics?.predictor}
            />
          )}

          {activeTab === 'insights' && (
            <AiInsights 
              insights={currentAnalytics?.aiInsights}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactReport 
              data={filteredData}
              capProgressAt100={capProgressAt100}
            />
          )}

          {activeTab === 'trends' && (
            <TrendsDashboard />
          )}

          {activeTab === 'supervisorValidation' && (
            <SupervisorValidation 
              rawCensusData={rawCensusData}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print mt-auto border-t border-slate-200 bg-white/60 py-6 px-8 dark:border-slate-800 dark:bg-slate-950/60 backdrop-blur-md">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse-slow"></span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Janganana Analytics Portal • National Census Performance & Validation System
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 md:items-end">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-400 dark:text-slate-500">© {new Date().getFullYear()}</span>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <span className="bg-gradient-to-r from-gov-600 via-gold-600 to-gov-700 bg-clip-text text-transparent dark:from-gold-400 dark:via-amber-400 dark:to-gold-500 font-display tracking-wider font-extrabold uppercase">
                    Created with Purpose by Yuvraj Singh Tomar
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                </div>
              </div>
              <span className="text-[10px] tracking-widest text-slate-400 dark:text-slate-500 uppercase font-bold">
                Designed for Impact & Precision
              </span>
            </div>
          </div>
        </footer>

        {/* PDF Executive Print-Only View */}
        {currentAnalytics && activeTab === 'dashboard' && (
          <div className="print-only hidden print-container p-8">
            {/* Report Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-tight">Ministry of Home Affairs, Government of India</h1>
              <h2 className="text-lg font-semibold mt-1">Janganana Bureau - National Census Performance Executive Summary</h2>
              <span className="text-xs text-slate-500">Report Compiled on: {new Date().toLocaleDateString('en-IN')}</span>
            </div>

            {/* Performance Summary Grid */}
            <h3 className="text-sm font-bold uppercase tracking-wide bg-slate-100 p-2 mb-3">1. Executive Overview</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Wards / Charges</span>
                <div className="text-xl font-bold">{currentAnalytics.summary.totalCharges}</div>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total House Listing Blocks</span>
                <div className="text-xl font-bold">{currentAnalytics.summary.totalHlbs}</div>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Overall Coverage Rate</span>
                <div className="text-xl font-bold">{currentAnalytics.summary.coveragePercent}%</div>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Expected Houses</span>
                <div className="text-xl font-bold">{currentAnalytics.summary.expectedHouses.toLocaleString()}</div>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Surveyed Houses</span>
                <div className="text-xl font-bold">{currentAnalytics.summary.surveyedHouses.toLocaleString()}</div>
              </div>
              <div className="border border-slate-300 p-3 rounded">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Population Counted</span>
                <div className="text-xl font-bold">{currentAnalytics.summary.totalPopulation.toLocaleString()}</div>
              </div>
            </div>

            {/* Low Performing Charges */}
            <div className="print-page-break"></div>
            
            <h3 className="text-sm font-bold uppercase tracking-wide bg-slate-100 p-2 mb-3 mt-4">2. Attention Required: Lagging Charges</h3>
            <table className="w-full border-collapse border border-slate-400 text-xs text-left mb-6">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 p-2">Charge ID</th>
                  <th className="border border-slate-400 p-2">Name</th>
                  <th className="border border-slate-400 p-2">Coverage %</th>
                  <th className="border border-slate-400 p-2">Supervisor</th>
                  <th className="border border-slate-400 p-2">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {currentAnalytics.nonPerformingCharges.map((c, i) => (
                  <tr key={i}>
                    <td className="border border-slate-400 p-2 font-bold">{c.chargeId}</td>
                    <td className="border border-slate-400 p-2">{c.chargeName}</td>
                    <td className="border border-slate-400 p-2 font-extrabold">{c.coveragePercent}%</td>
                    <td className="border border-slate-400 p-2">{c.supervisorName}</td>
                    <td className="border border-slate-400 p-2 text-[10px] text-red-700">{c.reasons.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Supervisor performance */}
            <h3 className="text-sm font-bold uppercase tracking-wide bg-slate-100 p-2 mb-3 mt-4">3. Supervisor Verification Backlogs</h3>
            <table className="w-full border-collapse border border-slate-400 text-xs text-left mb-6">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 p-2">Supervisor Name</th>
                  <th className="border border-slate-400 p-2">Total HLBs</th>
                  <th className="border border-slate-400 p-2">Completed HLBs</th>
                  <th className="border border-slate-400 p-2">Verification %</th>
                  <th className="border border-slate-400 p-2">Pending Houses</th>
                </tr>
              </thead>
              <tbody>
                {currentAnalytics.supervisorsList.map((s, i) => (
                  <tr key={i}>
                    <td className="border border-slate-400 p-2 font-bold">{s.name}</td>
                    <td className="border border-slate-400 p-2">{s.totalHlbs}</td>
                    <td className="border border-slate-400 p-2">{s.completedHlbs}</td>
                    <td className="border border-slate-400 p-2 font-bold">{s.verificationPercent}%</td>
                    <td className="border border-slate-400 p-2 font-bold">{s.pendingHouses}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Official Stamps */}
            <div className="mt-16 flex justify-between text-xs px-12">
              <div className="text-center">
                <div className="h-16 w-32 border-b border-dashed border-slate-400 mb-2"></div>
                <span>Prepared by: Janganana Officer</span>
              </div>
              <div className="text-center">
                <div className="h-16 w-32 border-b border-dashed border-slate-400 mb-2"></div>
                <span>Approved by: Director of Census Operations</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
