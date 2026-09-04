import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const pagePath = path.join(
  process.cwd(),
  'app',
  'teacher',
  'dashboard',
  'page.tsx'
);

const detailPagePath = path.join(
  process.cwd(),
  'app',
  'teacher',
  'reports',
  '[id]',
  'page.tsx'
);

describe('TeacherDashboardPage review queue entry', () => {
  it('loads submitted reports into a separate review queue and disables an empty entry', async () => {
    const source = await readFile(pagePath, 'utf8');

    expect(source).toContain("'/api/teacher/book-reports?status=submitted'");
    expect(source).toContain('setReviewQueueIds(createReviewQueue(data?.reports ?? []))');
    expect(source).toContain('disabled={reviewQueueIds.length === 0}');
  });
});

describe('TeacherReportDetailPage sequential review', () => {
  it('keeps the review queue context, requires a rejection reason, and advances after success', async () => {
    const source = await readFile(detailPagePath, 'utf8');

    expect(source).toContain("import { useRouter, useSearchParams } from 'next/navigation';");
    expect(source).toContain("import { parseReviewQueue, reviewQueueHref } from '@/lib/review-queue';");
    expect(source).toContain('const searchParams = useSearchParams();');
    expect(source).toContain(
      "const queuePosition = parseReviewQueue(searchParams.get('queue'), searchParams.get('index'), id);"
    );
    expect(source).toContain("if (decision === 'rejected' && !comment.trim()) {");
    expect(source).toContain("setError('반려 사유를 입력해 주세요.');");
    expect(source).toContain('router.push(`/teacher/reports/${queuePosition.nextId}${reviewQueueHref(queuePosition.ids, queuePosition.index + 1)}`);');
    expect(source).toContain("router.push('/teacher/dashboard');");
  });
});
