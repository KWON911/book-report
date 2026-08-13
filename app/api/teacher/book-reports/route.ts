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

  let query = supabaseClient
    .from('book_reports')
    .select('*, student:students(name, number, class_id, class:classes(name))')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (classId) {
    query = query.eq('student.class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
