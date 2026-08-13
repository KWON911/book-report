import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'report-1',
          student_id: 'student-1',
          title: '어린 왕자',
          status: 'approved',
          teacher_comment: null,
        },
        error: null,
      }),
    }),
  },
}));

vi.mock('@/lib/teacher-session', () => ({
  verifyTeacherSession: vi.fn().mockReturnValue(false),
}));

import { PATCH } from '@/app/api/teacher/book-reports/[id]/review/route';

describe('PATCH /api/teacher/book-reports/[id]/review', () => {
  it('rejects unauthenticated requests', async () => {
    const req = new Request('http://localhost/api/teacher/book-reports/1/review', {
      method: 'PATCH',
      body: JSON.stringify({ decision: 'approved' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(401);
  });
});
