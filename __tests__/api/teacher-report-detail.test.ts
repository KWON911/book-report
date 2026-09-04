import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabaseClient: { from: vi.fn() } }));
vi.mock('@/lib/teacher-session', () => ({ verifyTeacherSession: vi.fn() }));

import { GET } from '@/app/api/teacher/book-reports/[id]/route';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

describe('GET /api/teacher/book-reports/[id]', () => {
  it('rejects an unauthenticated teacher', async () => {
    vi.mocked(verifyTeacherSession).mockReturnValue(false);

    const res = await GET(
      new Request('http://localhost/api/teacher/book-reports/report-1'),
      { params: Promise.resolve({ id: 'report-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns a report with its student and class', async () => {
    vi.mocked(verifyTeacherSession).mockReturnValue(true);
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'report-1',
        student: {
          id: 'student-1',
          name: '홍길동',
          number: 12,
          class: { name: '2학년 3반' },
        },
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(supabaseClient.from).mockReturnValue({ select } as never);

    const res = await GET(
      new Request('http://localhost/api/teacher/book-reports/report-1'),
      { params: Promise.resolve({ id: 'report-1' }) }
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      report: {
        student: {
          name: '홍길동',
          number: 12,
          class: { name: '2학년 3반' },
        },
      },
    });
  });
});
