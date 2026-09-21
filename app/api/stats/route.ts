import { NextRequest, NextResponse } from 'next/server';
import { calculateSLAStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batch_id') || undefined;

    const stats = calculateSLAStats(batchId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching SLA stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate SLA statistics', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
