import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabaseClient
    .from('book_report_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('DELETE /api/teacher/book-reports/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
