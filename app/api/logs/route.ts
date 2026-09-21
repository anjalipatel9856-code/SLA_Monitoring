import { NextRequest, NextResponse } from 'next/server';
import { queryLogs } from '@/lib/db';
import { LogFilterParams } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: LogFilterParams = {
      batch_id: searchParams.get('batch_id') || undefined,
      service_id: searchParams.get('service_id') || undefined,
      status_type: (searchParams.get('status_type') as any) || 'all',
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    const result = queryLogs(params);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to query check logs', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
