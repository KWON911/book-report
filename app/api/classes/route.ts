import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function GET(req: Request) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseClient
    .from('classes')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('GET /api/classes failed:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }

  return NextResponse.json({ classes: data });
}
