import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { decision, comment } = body;

  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json(
      { error: 'decision must be approved or rejected' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseClient
    .from('book_reports')
    .update({ status: decision, teacher_comment: comment ?? null })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
