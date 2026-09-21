import fs from 'fs';
import path from 'path';
import { CleanedHealthCheck, LogFilterParams, OverallStats, ServiceSLAStats, UploadBatch } from './types';

const dataDir = path.join(process.cwd(), '.data');
const batchesFilePath = path.join(dataDir, 'batches.json');
const checksFilePath = path.join(dataDir, 'health_checks.json');

function ensureDataStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(batchesFilePath)) {
    fs.writeFileSync(batchesFilePath, JSON.stringify([]), 'utf-8');
  }
  if (!fs.existsSync(checksFilePath)) {
    fs.writeFileSync(checksFilePath, JSON.stringify([]), 'utf-8');
  }
}

export function getAllBatches(): UploadBatch[] {
  ensureDataStorage();
  try {
    const raw = fs.readFileSync(batchesFilePath, 'utf-8');
    const batches: UploadBatch[] = JSON.parse(raw);
    return batches.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  } catch {
    return [];
  }
}

export function getLatestUploadBatch(): UploadBatch | undefined {
  const batches = getAllBatches();
  return batches[0];
}

export function getAllChecks(): CleanedHealthCheck[] {
  ensureDataStorage();
  try {
    const raw = fs.readFileSync(checksFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveBatchAndChecks(batch: UploadBatch, newChecks: CleanedHealthCheck[]) {
  ensureDataStorage();

  const batches = getAllBatches();
  batches.unshift(batch);
  fs.writeFileSync(batchesFilePath, JSON.stringify(batches, null, 2), 'utf-8');

  const existingChecks = getAllChecks();
  const combinedChecks = [...newChecks, ...existingChecks];
  fs.writeFileSync(checksFilePath, JSON.stringify(combinedChecks), 'utf-8');
}

export function calculateSLAStats(batchId?: string): OverallStats {
  const allChecks = getAllChecks();
  const checks = batchId ? allChecks.filter(c => c.batch_id === batchId) : allChecks;

  const total_checks = checks.length;
  let successful_checks = 0;
  let failed_checks = 0;
  let total_latency = 0;

  const serviceMap = new Map<string, {
    service_id: string;
    service_name: string;
    total: number;
    success: number;
    failed: number;
    latencies: number[];
  }>();

  const allLatencies: number[] = [];

  for (const c of checks) {
    if (c.is_success) {
      successful_checks++;
    } else {
      failed_checks++;
    }
    total_latency += c.latency_ms;
    allLatencies.push(c.latency_ms);

    if (!serviceMap.has(c.service_id)) {
      serviceMap.set(c.service_id, {
        service_id: c.service_id,
        service_name: c.service_name,
        total: 0,
        success: 0,
        failed: 0,
        latencies: [],
      });
    }

    const sEntry = serviceMap.get(c.service_id)!;
    sEntry.total++;
    if (c.is_success) sEntry.success++;
    else sEntry.failed++;
    sEntry.latencies.push(c.latency_ms);
  }

  const overall_availability_pct = total_checks > 0
    ? parseFloat(((successful_checks / total_checks) * 100).toFixed(3))
    : 100.0;

  const avg_latency_ms = total_checks > 0 ? Math.round(total_latency / total_checks) : 0;

  // P95 calculation overall
  allLatencies.sort((a, b) => a - b);
  const p95Idx = Math.floor(allLatencies.length * 0.95);
  const p95_latency_ms = allLatencies[p95Idx] || 0;

  let services_below_sla = 0;
  const service_stats: ServiceSLAStats[] = [];

  for (const [sId, sData] of serviceMap.entries()) {
    const avail = sData.total > 0 ? parseFloat(((sData.success / sData.total) * 100).toFixed(3)) : 100.0;
    const meets_sla = avail >= 99.9;
    if (!meets_sla) services_below_sla++;

    sData.latencies.sort((a, b) => a - b);
    const sP95Idx = Math.floor(sData.latencies.length * 0.95);
    const sP95 = sData.latencies[sP95Idx] || 0;
    const sAvg = sData.total > 0 ? Math.round(sData.latencies.reduce((a, b) => a + b, 0) / sData.total) : 0;

    service_stats.push({
      service_id: sData.service_id,
      service_name: sData.service_name,
      total_checks: sData.total,
      successful_checks: sData.success,
      failed_checks: sData.failed,
      availability_pct: avail,
      avg_latency_ms: sAvg,
      p95_latency_ms: sP95,
      meets_sla,
      status: meets_sla ? 'OPTIMAL' : 'SLA_BREACH',
    });
  }

  service_stats.sort((a, b) => a.service_id.localeCompare(b.service_id));

  return {
    total_checks,
    successful_checks,
    failed_checks,
    overall_availability_pct,
    target_sla_pct: 99.9,
    overall_meets_sla: overall_availability_pct >= 99.9,
    avg_latency_ms,
    p95_latency_ms,
    total_services: service_stats.length,
    services_below_sla,
    service_stats,
    latest_upload_batch: getLatestUploadBatch(),
  };
}

export function queryLogs(params: LogFilterParams) {
  let logs = getAllChecks();

  if (params.batch_id) {
    logs = logs.filter(c => c.batch_id === params.batch_id);
  }

  if (params.service_id && params.service_id !== 'all') {
    logs = logs.filter(c => c.service_id === params.service_id);
  }

  if (params.status_type === 'success') {
    logs = logs.filter(c => c.is_success);
  } else if (params.status_type === 'failed') {
    logs = logs.filter(c => !c.is_success);
  }

  if (params.from_date) {
    const fromTime = new Date(params.from_date.includes('T') ? params.from_date : `${params.from_date}T00:00:00.000Z`).getTime();
    logs = logs.filter(c => new Date(c.timestamp).getTime() >= fromTime);
  }

  if (params.to_date) {
    const toTime = new Date(params.to_date.includes('T') ? params.to_date : `${params.to_date}T23:59:59.999Z`).getTime();
    logs = logs.filter(c => new Date(c.timestamp).getTime() <= toTime);
  }

  if (params.search) {
    const term = params.search.toLowerCase();
    logs = logs.filter(c =>
      c.service_id.toLowerCase().includes(term) ||
      c.service_name.toLowerCase().includes(term) ||
      c.agent.toLowerCase().includes(term) ||
      c.region.toLowerCase().includes(term) ||
      String(c.status_code).includes(term)
    );
  }

  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = logs.length;
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(10, params.limit || 20));
  const offset = (page - 1) * limit;

  const paginatedLogs = logs.slice(offset, offset + limit);

  return {
    logs: paginatedLogs,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}
