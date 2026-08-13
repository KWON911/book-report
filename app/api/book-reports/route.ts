import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseClient
    .from('book_report_entries')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/book-reports failed:', error);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { student_id, title, author, summary, impression, status } = body;

  if (!student_id || !title) {
    return NextResponse.json(
      { error: 'student_id and title are required' },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    student_id,
    title,
    author: author ?? null,
    summary: summary ?? null,
    impression: impression ?? null,
    status: status ?? 'draft',
  };

  if (insertData.status === 'submitted') {
    insertData.submitted_at = new Date().toISOString();
  }

  const { data, error } = await supabaseClient
    .from('book_report_entries')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('POST /api/book-reports failed:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
