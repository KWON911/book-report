import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

const UNIQUE_VIOLATION = '23505';

// Intentionally unauthenticated: the student identify screen needs to list
// classes for its dropdown, and a class name/id is not sensitive data.
export async function GET() {
  const { data, error } = await supabaseClient
    .from('book_report_classes')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('GET /api/classes failed:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }

  return NextResponse.json({ classes: data });
}

export async function POST(req: Request) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { data, error } = await supabaseClient
    .from('book_report_classes')
    .insert({ name: name.trim() })
    .select('id, name')
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: '이미 있는 학급 이름입니다.' }, { status: 409 });
    }
    console.error('POST /api/classes failed:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }

  return NextResponse.json({ class: data });
}
