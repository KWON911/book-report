import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function GET(req: Request) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('class_id');
  const status = searchParams.get('status');

  // PostgREST requires the `!inner` join modifier on an embedded relation for a
  // filter on that relation (student.class_id) to actually constrain the parent
  // rows. Without it, `.eq('student.class_id', ...)` is silently ignored.
  const studentEmbed = classId
    ? 'student:book_report_students!inner(id, name, number, class_id, class:book_report_classes(name))'
    : 'student:book_report_students(id, name, number, class_id, class:book_report_classes(name))';

  let query = supabaseClient
    .from('book_report_entries')
    .select(`*, ${studentEmbed}`)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (classId) {
    query = query.eq('student.class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('GET /api/teacher/book-reports failed:', error);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
