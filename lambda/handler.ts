import { parse } from 'csv-parse/sync';

export interface LambdaEvent {
  body?: string;
  isBase64Encoded?: boolean;
  headers?: Record<string, string>;
}

export const handler = async (event: LambdaEvent) => {
  try {
    let csvData = event.body || '';
    if (event.isBase64Encoded) {
      csvData = Buffer.from(csvData, 'base64').toString('utf-8');
    }

    if (!csvData) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Empty CSV payload' }),
      };
    }

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    const cleanedRows: any[] = [];
    let rejectedCount = 0;
    let duplicateCount = 0;
    const seenKeys = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const service_id = (row.service_id || '').trim();
      const rawTs = (row.timestamp !== undefined && row.timestamp !== null) ? String(row.timestamp).trim() : '';

      if (!service_id || !rawTs) {
        rejectedCount++;
        continue;
      }

      let parsedDate: Date | null = null;
      if (/^\d+$/.test(rawTs)) {
        parsedDate = new Date(parseInt(rawTs, 10) * 1000);
      } else {
        parsedDate = new Date(rawTs);
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        rejectedCount++;
        continue;
      }

      const isoTimestamp = parsedDate.toISOString();
      const statusCode = parseInt(String(row.status_code).trim(), 10);
      if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
        rejectedCount++;
        continue;
      }

      const rawUnit = (row.latency_unit || 'ms').trim().toLowerCase();
      const rawLatencyStr = (row.latency !== undefined && row.latency !== null) ? String(row.latency).trim() : '';
      let latencyMs = 0;

      if (!rawLatencyStr) {
        if (statusCode >= 500) latencyMs = 0;
        else { rejectedCount++; continue; }
      } else {
        const val = parseFloat(rawLatencyStr);
        if (isNaN(val) || val < 0) { rejectedCount++; continue; }
        latencyMs = rawUnit === 's' ? Math.round(val * 1000) : Math.round(val);
      }

      const dedupKey = `${service_id}:${isoTimestamp}`;
      if (seenKeys.has(dedupKey)) {
        duplicateCount++;
        rejectedCount++;
        continue;
      }
      seenKeys.add(dedupKey);

      cleanedRows.push({
        service_id,
        service_name: (row.service_name || service_id).trim(),
        timestamp: isoTimestamp,
        status_code: statusCode,
        is_success: statusCode >= 200 && statusCode < 300,
        latency_ms: latencyMs,
        agent: (row.agent || 'agent-unknown').trim(),
        region: (row.region || 'region-unknown').trim(),
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        summary: {
          total_rows: records.length,
          valid_rows: cleanedRows.length,
          rejected_rows: rejectedCount,
          duplicate_rows: duplicateCount,
        },
        cleaned_sample: cleanedRows.slice(0, 10),
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Serverless processing error', details: error?.message }),
    };
  }
};
