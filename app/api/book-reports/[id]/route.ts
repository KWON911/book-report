import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseClient
    .from('book_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, author, summary, impression, status } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (author !== undefined) updateData.author = author;
  if (summary !== undefined) updateData.summary = summary;
  if (impression !== undefined) updateData.impression = impression;
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'submitted') {
      updateData.submitted_at = new Date().toISOString();
      updateData.teacher_comment = null;
    }
  }

  const { data, error } = await supabaseClient
    .from('book_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
