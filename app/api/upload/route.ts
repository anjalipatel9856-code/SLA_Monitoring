import { NextRequest, NextResponse } from 'next/server';
import { processCSVData } from '@/lib/cleaner';
import { saveBatchAndChecks } from '@/lib/db';
import { UploadBatch } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let filename = 'uploaded_checks.csv';
    let csvContent = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No CSV file provided in upload' }, { status: 400 });
      }
      filename = file.name || filename;
      csvContent = await file.text();
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      filename = body.filename || filename;
      csvContent = body.csvContent || body.csv || '';
    } else {
      csvContent = await req.text();
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { cleanedRows, report } = processCSVData(csvContent, batchId);

    const batch: UploadBatch = {
      id: batchId,
      filename,
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
      filename,
      summary: {
        total_rows: report.total_rows,
        valid_rows: report.valid_rows,
        rejected_rows: report.rejected_rows,
        duplicate_rows: report.duplicate_rows,
      },
      quality_report: report,
    });
  } catch (error: any) {
    console.error('Error processing CSV upload:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
