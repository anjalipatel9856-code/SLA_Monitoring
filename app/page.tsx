'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StatsSection } from '@/components/StatsSection';
import { LogsTable } from '@/components/LogsTable';
import { UploadModal } from '@/components/UploadModal';
import { OverallStats } from '@/lib/types';
import { Sparkles, ArrowRight, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<OverallStats | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.total_checks !== undefined) {
        setStats(data);

        // Auto-seed if database is currently empty
        if (data.total_checks === 0) {
          await autoSeedDefaultDataset();
        }
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoSeedDefaultDataset = async () => {
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'monitoring_checks_9d_seed101.csv' }),
      });
      if (res.ok) {
        const statsRes = await fetch('/api/stats');
        const updatedStats = await statsRes.json();
        setStats(updatedStats);
      }
    } catch (err) {
      console.error('Auto seed failed:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <Header
        stats={stats}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRefresh={fetchStats}
        loading={loading}
      />

      {/* Main Single-Screen Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Banner callout if dataset is populated */}
        {stats && stats.total_checks > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Active Ingested Dataset:</span>
                  <span className="font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                    {stats.latest_upload_batch?.filename || 'monitoring_checks_9d_seed101.csv'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {stats.total_checks.toLocaleString()} Cleaned Checks Persistent in Database • SLA Target: 99.9%
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Switch or Upload Dataset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section 1: Top Collapsible SLA Statistics Panel */}
        <StatsSection stats={stats} />

        {/* Section 2: Bottom Filterable Logs View */}
        <LogsTable onRefreshStats={fetchStats} />

      </main>

      {/* CSV Ingestion & Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchStats();
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>SLA Monitoring Dashboard • Stateless Cloud Processing Pipeline • Persistent Database Storage</p>
      </footer>

    </div>
  );
}
