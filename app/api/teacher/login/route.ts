import { NextResponse } from 'next/server';
import { createTeacherSessionToken } from '@/lib/teacher-session';

export async function POST(req: Request) {
  const body = await req.json();
  const { password } = body;

  if (password !== process.env.TEACHER_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = createTeacherSessionToken();
  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    `teacher_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800`
  );
  return res;
}
