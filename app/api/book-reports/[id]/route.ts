import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

// Intentionally unauthenticated: any caller who knows/guesses a report UUID can
// read that single report. Given this app's overall trust model (students are
// only identified by name+class+number, not real auth), this is acceptable for
// a small-scale classroom deployment — a leaked UUID exposes one report, not
// the dataset.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseClient
    .from('book_report_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('GET /api/book-reports/[id] failed:', error);
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, author, categories, content, status } = body;

  // This endpoint is student-facing and unauthenticated. Students may only move
  // a report to 'draft' or 'submitted' — moving to 'approved'/'rejected' must go
  // through the teacher-authenticated /api/teacher/book-reports/[id]/review route.
  if (status !== undefined && status !== 'draft' && status !== 'submitted') {
    return NextResponse.json(
      { error: 'status must be draft or submitted' },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (author !== undefined) updateData.author = author;
  if (categories !== undefined) updateData.categories = categories;
  if (content !== undefined) updateData.content = content;
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'submitted') {
      updateData.submitted_at = new Date().toISOString();
      updateData.teacher_comment = null;
    }
  }

  const { data, error } = await supabaseClient
    .from('book_report_entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('PATCH /api/book-reports/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
