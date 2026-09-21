'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertOctagon, Info, Database, Sparkles, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { DataQualityReport } from '@/lib/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSeedFile, setSelectedSeedFile] = useState<string>('monitoring_checks_9d_seed101.csv');
  const [availableSeedFiles, setAvailableSeedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'seed'>('seed');
  const [showRejections, setShowRejections] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/seed')
        .then(res => res.json())
        .then(data => {
          if (data.files) {
            setAvailableSeedFiles(data.files);
            if (data.files.length > 0) {
              setSelectedSeedFile(data.files[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload CSV');
      }

      setReport(data.quality_report);
      onUploadSuccess();
    } catch (err: any) {
      setError(err?.message || 'Error processing CSV file');
    } finally {
      setUploading(false);
    }
  };

  const handleSeedLoad = async (fileNameToLoad?: string) => {
    const fileToUse = fileNameToLoad || selectedSeedFile;
    setUploading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: fileToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to seed dataset');
      }

      setReport(data.quality_report);
      onUploadSuccess();
    } catch (err: any) {
      setError(err?.message || 'Error seeding dataset file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Upload & Ingest Monitoring CSV</h2>
            <p className="text-xs text-slate-400">Handed off to cloud processing engine for validation & persistence</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('seed')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'seed' ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Dataset CSV (9d, 12d, 14d, 21d, 30d)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'upload' ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Upload Custom CSV</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'seed' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Select one of the benchmark monitoring check datasets to ingest into the database:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSeedFiles.map((f) => {
                const daysMatch = f.match(/(\d+)d/);
                const days = daysMatch ? daysMatch[1] : '';
                const isSelected = selectedSeedFile === f;

                return (
                  <div
                    key={f}
                    onClick={() => {
                      setSelectedSeedFile(f);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{f}</div>
                        <div className="text-[10px] text-slate-400">{days ? `${days}-Day Continuous Monitor` : 'Health Checks CSV'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => handleSeedLoad()}
              disabled={uploading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <span>Cleaning & Ingesting Dataset...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process Selected Dataset ({selectedSeedFile})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 text-center bg-slate-950/40 transition">
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-3 bg-slate-800 rounded-full text-slate-300">
                  <UploadCloud className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Click to upload CSV</span>
                  <span className="text-xs text-slate-400 block mt-1">Accepts standard health-check monitoring CSV files</span>
                </div>
                {file && (
                  <div className="mt-2 px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono rounded-lg">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={handleFileUpload}
              disabled={!file || uploading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? <span>Processing & Cleaning CSV...</span> : <span>Process & Store CSV</span>}
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Quality Report Summary */}
        {report && (
          <div className="mt-6 border-t border-slate-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Ingestion & Cleaning Complete</span>
              </div>
              <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
                Batch Processed
              </span>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Raw Rows</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">{report.total_rows.toLocaleString()}</div>
              </div>
              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/50">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Valid Cleaned</div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{report.valid_rows.toLocaleString()}</div>
              </div>
              <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
                <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Rejected Rows</div>
                <div className="text-base font-bold text-rose-400 font-mono mt-0.5">{report.rejected_rows.toLocaleString()}</div>
              </div>
              <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/50">
                <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Duplicates Removed</div>
                <div className="text-base font-bold text-amber-400 font-mono mt-0.5">{report.duplicate_rows.toLocaleString()}</div>
              </div>
            </div>

            {/* Data Quality Transformation Highlights */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Data Normalization Audit Findings:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div>• <strong className="text-slate-200">Timestamp Normalization:</strong> {report.timestamp_formats.iso_count} ISO strings, {report.timestamp_formats.unix_count} Unix epoch seconds converted to UTC.</div>
                <div>• <strong className="text-slate-200">Latency Conversion:</strong> {report.latency_unit_conversions.ms_count} ms, {report.latency_unit_conversions.s_count} seconds converted to integer ms.</div>
              </div>
            </div>

            {/* Collapsible Rejections List */}
            {Object.keys(report.rejections_by_reason).length > 0 && (
              <div>
                <button
                  onClick={() => setShowRejections(!showRejections)}
                  className="w-full text-xs text-slate-400 hover:text-white flex items-center justify-between py-1.5"
                >
                  <span>View Rejection Reason Breakdown ({Object.keys(report.rejections_by_reason).length} rules triggered)</span>
                  {showRejections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRejections && (
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 mt-2 max-h-40 overflow-y-auto font-mono">
                    {Object.entries(report.rejections_by_reason).map(([reason, count]) => (
                      <div key={reason} className="flex justify-between items-center text-slate-300 text-[11px]">
                        <span>❌ {reason}</span>
                        <span className="text-rose-400 font-bold">{count} rows</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              Close & View Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
