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

  // Delete the student's reports first: there's no ON DELETE CASCADE on
  // book_report_entries.student_id, so an orphaned FK would block the
  // student delete below.
  const { error: reportsError } = await supabaseClient
    .from('book_report_entries')
    .delete()
    .eq('student_id', id);

  if (reportsError) {
    console.error('DELETE /api/teacher/students/[id] (reports) failed:', reportsError);
    return NextResponse.json({ error: 'Failed to delete student reports' }, { status: 500 });
  }

  const { error: studentError } = await supabaseClient
    .from('book_report_students')
    .delete()
    .eq('id', id);

  if (studentError) {
    console.error('DELETE /api/teacher/students/[id] failed:', studentError);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
