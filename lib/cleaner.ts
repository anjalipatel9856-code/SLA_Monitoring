import { parse } from 'csv-parse/sync';
import { CleanedHealthCheck, DataQualityReport, RawHealthCheckRow, RejectedRow } from './types';
import { validateHealthCheckRow } from './validator';

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
    // Step 4: Run Data Validation Rules
    const validation = validateHealthCheckRow(row);
    if (!validation.isValid || !validation.parsedDate || validation.statusCode === undefined || validation.rawLatencyVal === undefined) {
      if (validation.reason?.includes('timestamp')) invalid_ts_count++;
      recordRejection(index, row, validation.reason || 'Validation failed');
      return;
    }

    const service_id = (row.service_id || '').trim();
    const service_name = (row.service_name || service_id).trim();

    // Timestamp stats
    const rawTs = String(row.timestamp || '').trim();
    if (/^\d+$/.test(rawTs)) unix_count++;
    else iso_count++;

    const isoTimestamp = validation.parsedDate.toISOString();

    // Step 5: Data Cleaning & Latency Unit Conversion
    const rawUnit = (row.latency_unit || 'ms').trim().toLowerCase();
    let latencyMs = 0;
    if (rawUnit === 's') {
      s_count++;
      latencyMs = Math.round(validation.rawLatencyVal * 1000);
    } else {
      ms_count++;
      latencyMs = Math.round(validation.rawLatencyVal);
    }

    const agent = (row.agent || 'agent-unknown').trim();
    const region = (row.region || 'region-unknown').trim();

    // Deduplication by (service_id, timestamp)
    const dedupKey = `${service_id}:${isoTimestamp}`;
    if (seenKeys.has(dedupKey)) {
      duplicate_rows++;
      recordRejection(index, row, `Duplicate record for key (${dedupKey})`);
      return;
    }
    seenKeys.add(dedupKey);

    const is_success = validation.statusCode >= 200 && validation.statusCode < 300;

    cleanedRows.push({
      id: `${batchId}_${cleanedRows.length + 1}`,
      batch_id: batchId,
      service_id,
      service_name,
      timestamp: isoTimestamp,
      status_code: validation.statusCode,
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
