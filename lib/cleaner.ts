import { parse } from 'csv-parse/sync';
import { CleanedHealthCheck, DataQualityReport, RawHealthCheckRow, RejectedRow } from './types';

export interface ProcessedCSVResult {
  cleanedRows: CleanedHealthCheck[];
  report: DataQualityReport;
}

export function processCSVData(csvContent: string, batchId: string): ProcessedCSVResult {
  const records: RawHealthCheckRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const total_rows = records.length;
  const cleanedRows: CleanedHealthCheck[] = [];
  const rejected_samples: RejectedRow[] = [];
  const rejections_by_reason: Record<string, number> = {};

  let duplicate_rows = 0;
  let iso_count = 0;
  let unix_count = 0;
  let invalid_ts_count = 0;
  let ms_count = 0;
  let s_count = 0;

  const seenKeys = new Set<string>();

  function recordRejection(rowIndex: number, rawData: Record<string, any>, reason: string) {
    rejections_by_reason[reason] = (rejections_by_reason[reason] || 0) + 1;
    if (rejected_samples.length < 50) {
      rejected_samples.push({
        row_index: rowIndex + 1,
        raw_data: rawData,
        reason,
      });
    }
  }

  records.forEach((row, index) => {
    // 1. Service ID & Service Name validation
    const service_id = (row.service_id || '').trim();
    const service_name = (row.service_name || service_id).trim();

    if (!service_id) {
      recordRejection(index, row, 'Missing service_id');
      return;
    }

    // 2. Timestamp validation & normalization
    let parsedDate: Date | null = null;
    const rawTs = (row.timestamp !== undefined && row.timestamp !== null) ? String(row.timestamp).trim() : '';

    if (!rawTs) {
      invalid_ts_count++;
      recordRejection(index, row, 'Missing timestamp');
      return;
    }

    // Check if numeric unix epoch timestamp (seconds)
    if (/^\d+$/.test(rawTs)) {
      const epochSec = parseInt(rawTs, 10);
      parsedDate = new Date(epochSec * 1000);
      unix_count++;
    } else {
      parsedDate = new Date(rawTs);
      if (!isNaN(parsedDate.getTime())) {
        iso_count++;
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      invalid_ts_count++;
      recordRejection(index, row, `Invalid timestamp format: "${rawTs}"`);
      return;
    }

    const isoTimestamp = parsedDate.toISOString();

    // 3. Status Code validation
    const rawStatus = (row.status_code !== undefined && row.status_code !== null) ? String(row.status_code).trim() : '';
    const statusCode = parseInt(rawStatus, 10);

    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
      recordRejection(index, row, `Invalid HTTP status code: "${rawStatus}"`);
      return;
    }

    // 4. Latency Unit & Value validation
    const rawUnit = (row.latency_unit || 'ms').trim().toLowerCase();
    const rawLatencyStr = (row.latency !== undefined && row.latency !== null) ? String(row.latency).trim() : '';

    let latencyMs = 0;

    if (!rawLatencyStr) {
      if (statusCode >= 500) {
        latencyMs = 0; // Default 0 for failed checks with missing latency
      } else {
        recordRejection(index, row, 'Missing latency value');
        return;
      }
    } else {
      const rawLatencyVal = parseFloat(rawLatencyStr);
      if (isNaN(rawLatencyVal)) {
        recordRejection(index, row, `Malformed non-numeric latency: "${rawLatencyStr}"`);
        return;
      }

      if (rawLatencyVal < 0) {
        recordRejection(index, row, `Negative latency value: ${rawLatencyVal}`);
        return;
      }

      if (rawUnit === 's') {
        s_count++;
        latencyMs = Math.round(rawLatencyVal * 1000);
      } else {
        ms_count++;
        latencyMs = Math.round(rawLatencyVal);
      }
    }

    // 5. Agent & Region validation
    const agent = (row.agent || 'agent-unknown').trim();
    const region = (row.region || 'region-unknown').trim();

    // 6. Deduplication check
    const dedupKey = `${service_id}:${isoTimestamp}`;
    if (seenKeys.has(dedupKey)) {
      duplicate_rows++;
      recordRejection(index, row, `Duplicate record for key (${dedupKey})`);
      return;
    }

    seenKeys.add(dedupKey);

    // Success check condition
    const is_success = statusCode >= 200 && statusCode < 300;

    cleanedRows.push({
      id: `${batchId}_${cleanedRows.length + 1}`,
      batch_id: batchId,
      service_id,
      service_name,
      timestamp: isoTimestamp,
      status_code: statusCode,
      is_success,
      latency_ms: latencyMs,
      agent,
      region,
    });
  });

  const valid_rows = cleanedRows.length;
  const rejected_rows = total_rows - valid_rows;

  const report: DataQualityReport = {
    total_rows,
    valid_rows,
    rejected_rows,
    duplicate_rows,
    rejections_by_reason,
    rejected_samples,
    timestamp_formats: {
      iso_count,
      unix_count,
      invalid_count: invalid_ts_count,
    },
    latency_unit_conversions: {
      ms_count,
      s_count,
    },
  };

  return { cleanedRows, report };
}
