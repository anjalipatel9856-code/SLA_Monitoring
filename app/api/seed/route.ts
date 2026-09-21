import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { processCSVData } from '@/lib/cleaner';
import { saveBatchAndChecks } from '@/lib/db';
import { UploadBatch } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const datasetFile = body.file || 'monitoring_checks_9d_seed101.csv';

    const projectDir = process.cwd();
    const csvPath = path.join(projectDir, datasetFile);

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: `Dataset file not found: ${datasetFile}` }, { status: 404 });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const batchId = `seed_${Date.now()}_${path.basename(datasetFile, '.csv')}`;
    const { cleanedRows, report } = processCSVData(csvContent, batchId);

    const batch: UploadBatch = {
      id: batchId,
      filename: datasetFile,
      total_rows: report.total_rows,
      valid_rows: report.valid_rows,
      rejected_rows: report.rejected_rows,
      duplicate_rows: report.duplicate_rows,
      quality_report: JSON.stringify(report),
      uploaded_at: new Date().toISOString(),
    };

    saveBatchAndChecks(batch, cleanedRows);

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      filename: datasetFile,
      summary: {
        total_rows: report.total_rows,
        valid_rows: report.valid_rows,
        rejected_rows: report.rejected_rows,
        duplicate_rows: report.duplicate_rows,
      },
      quality_report: report,
    });
  } catch (error: any) {
    console.error('Error seeding dataset:', error);
    return NextResponse.json(
      { error: 'Failed to seed dataset', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projectDir = process.cwd();
    const files = fs.readdirSync(projectDir)
      .filter(f => f.endsWith('.csv'))
      .sort();

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to list dataset files' }, { status: 500 });
  }
}
