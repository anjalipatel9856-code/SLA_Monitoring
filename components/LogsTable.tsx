'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, ChevronLeft, ChevronRight, Server, Globe, Cpu, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CleanedHealthCheck, LogFilterParams } from '@/lib/types';

interface LogsTableProps {
  onRefreshStats: () => void;
}

export function LogsTable({ onRefreshStats }: LogsTableProps) {
  const [logs, setLogs] = useState<CleanedHealthCheck[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, total_pages: 1 });
  const [loading, setLoading] = useState<boolean>(false);

  // Filter States
  const [serviceId, setServiceId] = useState<string>('all');
  const [statusType, setStatusType] = useState<'all' | 'success' | 'failed'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (serviceId !== 'all') query.set('service_id', serviceId);
      if (statusType !== 'all') query.set('status_type', statusType);
      if (fromDate) query.set('from_date', fromDate);
      if (toDate) query.set('to_date', toDate);
      if (search) query.set('search', search);
      query.set('page', String(page));
      query.set('limit', '20');

      const res = await fetch(`/api/logs?${query.toString()}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [serviceId, statusType, fromDate, toDate, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setServiceId('all');
    setStatusType('all');
    setFromDate('');
    setToDate('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Title & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Health Check Inspection Logs</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {pagination.total.toLocaleString()} Records Filtered
            </span>
          </div>
          <p className="text-xs text-slate-400">Underlying monitoring check telemetry cleaned and stored in persistent database</p>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Service Select */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Filter Service</label>
          <div className="relative">
            <select
              value={serviceId}
              onChange={(e) => { setServiceId(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none"
            >
              <option value="all">All Services (5)</option>
              <option value="svc-auth">svc-auth (Auth API)</option>
              <option value="svc-payments">svc-payments (Payments API)</option>
              <option value="svc-reports">svc-reports (Reports API)</option>
              <option value="svc-search">svc-search (Search API)</option>
              <option value="svc-notify">svc-notify (Notify Worker)</option>
            </select>
            <Server className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">HTTP Status</label>
          <select
            value={statusType}
            onChange={(e) => { setStatusType(e.target.value as any); setPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All HTTP Statuses</option>
            <option value="success">HTTP 200 (Success)</option>
            <option value="failed">HTTP 50x (Failures)</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Search Input */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Keyword Search</label>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search agent, region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-cyan-400">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Logs Data Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Status Code</th>
              <th className="py-3 px-4">Latency (ms)</th>
              <th className="py-3 px-4">Agent / Region</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                  <span>Loading check records...</span>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <span>No check records match the selected date or filter criteria.</span>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSuccess = log.is_success;
                const dateStr = new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19);

                return (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-white">{log.service_id}</span>
                      <span className="text-[10px] text-slate-400 font-sans block">{log.service_name}</span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSuccess
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse'
                      }`}>
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-purple-300 font-semibold">
                      {log.latency_ms} ms
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-400 text-[11px] font-sans">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>{log.agent}</span>
                        <span className="text-slate-600">•</span>
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>{log.region}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <div>
            Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
            <strong className="text-white">{pagination.total_pages}</strong> ({pagination.total.toLocaleString()} records)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
              disabled={page >= pagination.total_pages}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
