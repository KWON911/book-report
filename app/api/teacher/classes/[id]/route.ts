import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

// Deletes a class entirely: every student in it, their reports (via the
// students), and the class row itself. Fully irreversible.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { confirmName } = body;

  const { data: classRow, error: classError } = await supabaseClient
    .from('book_report_classes')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (classError) {
    console.error('DELETE /api/teacher/classes/[id] (lookup) failed:', classError);
    return NextResponse.json({ error: 'Failed to look up class' }, { status: 500 });
  }
  if (!classRow) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }
  if (confirmName !== classRow.name) {
    return NextResponse.json(
      { error: 'confirmName must exactly match the class name' },
      { status: 400 }
    );
  }

  const { data: students, error: studentsLookupError } = await supabaseClient
    .from('book_report_students')
    .select('id')
    .eq('class_id', id);

  if (studentsLookupError) {
    console.error('DELETE /api/teacher/classes/[id] (students lookup) failed:', studentsLookupError);
    return NextResponse.json({ error: 'Failed to look up students' }, { status: 500 });
  }

  const studentIds = (students ?? []).map((s) => s.id);

  if (studentIds.length > 0) {
    const { error: reportsError } = await supabaseClient
      .from('book_report_entries')
      .delete()
      .in('student_id', studentIds);

    if (reportsError) {
      console.error('DELETE /api/teacher/classes/[id] (reports) failed:', reportsError);
      return NextResponse.json({ error: 'Failed to delete class reports' }, { status: 500 });
    }

    const { error: studentsError } = await supabaseClient
      .from('book_report_students')
      .delete()
      .eq('class_id', id);

    if (studentsError) {
      console.error('DELETE /api/teacher/classes/[id] (students) failed:', studentsError);
      return NextResponse.json({ error: 'Failed to delete class students' }, { status: 500 });
    }
  }

  const { error: classDeleteError } = await supabaseClient
    .from('book_report_classes')
    .delete()
    .eq('id', id);

  if (classDeleteError) {
    console.error('DELETE /api/teacher/classes/[id] (class) failed:', classDeleteError);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
