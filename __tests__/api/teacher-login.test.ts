import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/teacher/login/route';

describe('POST /api/teacher/login', () => {
  beforeEach(() => {
    process.env.TEACHER_PASSWORD = 'test-password';
  });

  it('rejects wrong password', async () => {
    const req = new Request('http://localhost/api/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('accepts correct password and sets cookie', async () => {
    const req = new Request('http://localhost/api/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test-password' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('teacher_session=');
  });
});
