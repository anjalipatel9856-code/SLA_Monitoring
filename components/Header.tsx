'use client';

import React from 'react';
import { Upload, Activity, ShieldCheck, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { OverallStats } from '@/lib/types';

interface HeaderProps {
  stats?: OverallStats;
  onOpenUpload: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function Header({ stats, onOpenUpload, onRefresh, loading }: HeaderProps) {
  const meetsSla = stats ? stats.overall_meets_sla : true;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Status Pill */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">SLA Monitor</h1>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 uppercase">
                  Production Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated SLA Billing & Availability Engine</p>
            </div>
          </div>

          {/* SLA Overall Health Status Badge */}
          {stats && stats.total_checks > 0 && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${
              meetsSla 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-900/50' 
                : 'bg-rose-950/60 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-900/50'
            }`}>
              {meetsSla ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />}
              <span>{meetsSla ? 'SLA MET (≥ 99.9%)' : `SLA BREACH (${stats.overall_availability_pct.toFixed(2)}%)`}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center justify-center disabled:opacity-50"
            title="Refresh SLA Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm shadow-md shadow-cyan-600/20 border border-cyan-400/30 transition transform active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Health CSV</span>
          </button>
        </div>

      </div>
    </header>
  );
}
