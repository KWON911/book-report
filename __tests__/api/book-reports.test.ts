import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/book-reports/route';

vi.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'report-1',
          student_id: 'student-1',
          title: '어린 왕자',
          author: '생텍쥐페리',
          categories: ['줄거리'],
          content: '...',
          status: 'draft',
          teacher_comment: null,
          created_at: '2026-08-13T00:00:00Z',
          submitted_at: null,
        },
        error: null,
      }),
    }),
  },
}));

describe('POST /api/book-reports', () => {
  it('returns 400 when student_id is missing', async () => {
    const req = new Request('http://localhost/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({ title: '어린 왕자' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates a draft report', async () => {
    const req = new Request('http://localhost/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({
        student_id: 'student-1',
        title: '어린 왕자',
        author: '생텍쥐페리',
        summary: '...',
        impression: '...',
        status: 'draft',
      }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.report.status).toBe('draft');
  });
});
