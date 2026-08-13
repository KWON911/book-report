import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function GET(req: Request) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('class_id');

  if (!classId) {
    return NextResponse.json({ error: 'class_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseClient
    .from('book_report_students')
    .select('id, name, number')
    .eq('class_id', classId)
    .order('number', { ascending: true });

  if (error) {
    console.error('GET /api/teacher/students failed:', error);
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
  }

  return NextResponse.json({ students: data });
}
