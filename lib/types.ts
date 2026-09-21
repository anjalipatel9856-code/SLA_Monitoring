export interface RawHealthCheckRow {
  service_id?: string;
  service_name?: string;
  timestamp?: string | number;
  status_code?: string | number;
  latency?: string | number;
  latency_unit?: string;
  agent?: string;
  region?: string;
}

export interface CleanedHealthCheck {
  id: string;
  batch_id: string;
  service_id: string;
  service_name: string;
  timestamp: string; // ISO 8601 UTC
  status_code: number;
  is_success: boolean;
  latency_ms: number;
  agent: string;
  region: string;
  created_at?: string;
}

export interface RejectedRow {
  row_index: number;
  raw_data: Record<string, any>;
  reason: string;
}

export interface DataQualityReport {
  total_rows: number;
  valid_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  rejections_by_reason: Record<string, number>;
  rejected_samples: RejectedRow[];
  timestamp_formats: {
    iso_count: number;
    unix_count: number;
    invalid_count: number;
  };
  latency_unit_conversions: {
    ms_count: number;
    s_count: number;
  };
}

export interface UploadBatch {
  id: string;
  filename: string;
  total_rows: number;
  valid_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  quality_report: string; // JSON string
  uploaded_at: string;
}

export interface ServiceSLAStats {
  service_id: string;
  service_name: string;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  availability_pct: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  meets_sla: boolean; // >= 99.9%
  status: 'OPTIMAL' | 'SLA_BREACH';
}

export interface OverallStats {
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  overall_availability_pct: number;
  target_sla_pct: number;
  overall_meets_sla: boolean;
  avg_latency_ms: number;
  p95_latency_ms: number;
  total_services: number;
  services_below_sla: number;
  service_stats: ServiceSLAStats[];
  latest_upload_batch?: UploadBatch;
}

export interface LogFilterParams {
  batch_id?: string;
  service_id?: string;
  status_type?: 'all' | 'success' | 'failed';
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}
