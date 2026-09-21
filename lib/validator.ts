import { RawHealthCheckRow } from './types';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  parsedDate?: Date;
  statusCode?: number;
  rawLatencyVal?: number;
}

export function validateHealthCheckRow(row: RawHealthCheckRow): ValidationResult {
  // 1. Service ID validation
  const service_id = (row.service_id || '').trim();
  if (!service_id) {
    return { isValid: false, reason: 'Missing service_id' };
  }

  // 2. Timestamp validation
  const rawTs = (row.timestamp !== undefined && row.timestamp !== null) ? String(row.timestamp).trim() : '';
  if (!rawTs) {
    return { isValid: false, reason: 'Missing timestamp' };
  }

  let parsedDate: Date | null = null;
  if (/^\d+$/.test(rawTs)) {
    parsedDate = new Date(parseInt(rawTs, 10) * 1000);
  } else {
    parsedDate = new Date(rawTs);
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return { isValid: false, reason: `Invalid timestamp format: "${rawTs}"` };
  }

  // 3. Status Code validation
  const rawStatus = (row.status_code !== undefined && row.status_code !== null) ? String(row.status_code).trim() : '';
  const statusCode = parseInt(rawStatus, 10);
  if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    return { isValid: false, reason: `Invalid HTTP status code: "${rawStatus}"` };
  }

  // 4. Latency validation
  const rawLatencyStr = (row.latency !== undefined && row.latency !== null) ? String(row.latency).trim() : '';
  let rawLatencyVal: number | undefined = undefined;

  if (!rawLatencyStr) {
    if (statusCode < 500) {
      return { isValid: false, reason: 'Missing latency value' };
    }
    rawLatencyVal = 0;
  } else {
    rawLatencyVal = parseFloat(rawLatencyStr);
    if (isNaN(rawLatencyVal)) {
      return { isValid: false, reason: `Malformed non-numeric latency: "${rawLatencyStr}"` };
    }
    if (rawLatencyVal < 0) {
      return { isValid: false, reason: `Negative latency value: ${rawLatencyVal}` };
    }
  }

  return {
    isValid: true,
    parsedDate,
    statusCode,
    rawLatencyVal,
  };
}
