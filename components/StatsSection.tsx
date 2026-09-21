'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Activity, Clock, Layers, Server, CheckCircle2, XCircle } from 'lucide-react';
import { OverallStats } from '@/lib/types';

interface StatsSectionProps {
  stats?: OverallStats;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!stats || stats.total_checks === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 my-6">
        <Activity className="w-8 h-8 text-cyan-500/50 mx-auto mb-2 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-200">No SLA Monitoring Data Ingested Yet</h3>
        <p className="text-xs text-slate-400 mt-1">Upload a CSV or select one of the pre-loaded benchmark datasets to compute SLA availability.</p>
      </div>
    );
  }

  const meetsSla = stats.overall_meets_sla;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-8 transition-all">
      
      {/* Header bar (Collapsible toggle) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 bg-slate-900/90 hover:bg-slate-850 cursor-pointer flex items-center justify-between border-b border-slate-800 select-none transition"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            meetsSla ? 'bg-emerald-950/80 border-emerald-800/50 text-emerald-400' : 'bg-rose-950/80 border-rose-800/50 text-rose-400'
          }`}>
            {meetsSla ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">SLA Performance & Credit Analysis</h2>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                meetsSla ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {meetsSla ? 'Compliance Met' : 'Billing Credit Due'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Target SLA: 99.9% Availability across {stats.total_services} Services</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            {isExpanded ? 'Collapse Stats [-]' : 'Expand Stats [+]'}
          </span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Collapsible Content Body */}
      {isExpanded && (
        <div className="p-6 space-y-6 bg-slate-950/40">
          
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Overall Availability Card */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              meetsSla
                ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-800/40 shadow-lg shadow-emerald-950/30'
                : 'bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-800/40 shadow-lg shadow-rose-950/30'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Overall Availability</span>
                <Activity className={`w-4 h-4 ${meetsSla ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
              <div className={`text-3xl font-extrabold font-mono mt-2 ${meetsSla ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.overall_availability_pct.toFixed(3)}%
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Target: <strong className="text-slate-200">99.900%</strong></span>
                <span className={meetsSla ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {meetsSla ? 'Above Target' : 'Below SLA Target'}
                </span>
              </div>
            </div>

            {/* Total Checks & Success/Failure Count */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Total Checks</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-2">
                {stats.total_checks.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] flex items-center gap-3 border-t border-slate-800 pt-2">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {stats.successful_checks.toLocaleString()} Passed
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" /> {stats.failed_checks.toLocaleString()} Failed
                </span>
              </div>
            </div>

            {/* Response Latency (Avg & P95) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Response Latency</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-2">
                {stats.avg_latency_ms} <span className="text-xs font-normal text-slate-400">ms avg</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>P95 Tail Latency:</span>
                <strong className="text-purple-300 font-mono">{stats.p95_latency_ms} ms</strong>
              </div>
            </div>

            {/* Service Breaches Count */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Services Below SLA</span>
                <Server className="w-4 h-4 text-amber-400" />
              </div>
              <div className={`text-2xl font-bold font-mono mt-2 ${stats.services_below_sla > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.services_below_sla} <span className="text-xs font-normal text-slate-400">/ {stats.total_services} Services</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Compliance Status:</span>
                <span className={stats.services_below_sla === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {stats.services_below_sla === 0 ? 'All 5 Services OK' : `${stats.services_below_sla} Breach Detected`}
                </span>
              </div>
            </div>

          </div>

          {/* Service Breakdown Cards Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Individual Service Availability & Latency Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.service_stats.map((s) => {
                const isOptimal = s.meets_sla;

                return (
                  <div
                    key={s.service_id}
                    className={`p-4 rounded-xl border transition ${
                      isOptimal
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        : 'bg-rose-950/20 border-rose-900/60 shadow-sm shadow-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className={`w-4 h-4 ${isOptimal ? 'text-cyan-400' : 'text-rose-400'}`} />
                        <span className="text-sm font-bold text-white font-mono">{s.service_name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        isOptimal ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {s.availability_pct.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] border-t border-slate-800/80 pt-2.5">
                      <div>
                        <div className="text-slate-400 text-[10px]">Checks</div>
                        <div className="font-bold text-slate-200 font-mono">{s.total_checks.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Failures</div>
                        <div className={`font-bold font-mono ${s.failed_checks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {s.failed_checks}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Avg Latency</div>
                        <div className="font-bold text-purple-300 font-mono">{s.avg_latency_ms} ms</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
