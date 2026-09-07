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
  it('uses a compact responsive toolbar and keeps the review queue entry prominent', async () => {
    const source = await readFile(pagePath, 'utf8');

    expect(source).toContain('flex flex-wrap items-center gap-2 rounded border border-line bg-paper-raised p-2 mb-4');
    expect(source).toContain('w-full sm:w-[8.5rem]');
    expect(source).toContain('w-full sm:w-[10rem]');
    expect(source).toContain('sm:ml-auto');
    expect(source).toContain('w-full sm:w-auto bg-forest text-paper-raised');
    expect(source).toContain('focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest');
    expect(source).toContain('disabled:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest');
    expect(source).toContain('aria-label={`검토 대기 독서록 ${reviewQueueIds.length}건`}');
  });

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
