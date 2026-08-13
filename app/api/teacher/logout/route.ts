import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    `teacher_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`
  );
  return res;
}
