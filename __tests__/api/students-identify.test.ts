import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/students/identify/route';

vi.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'class-1', name: '3학년 2반' },
        error: null,
      }),
    }),
  },
}));

describe('POST /api/students/identify', () => {
  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/students/identify', {
      method: 'POST',
      body: JSON.stringify({ class_id: 'class-1', number: 5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
