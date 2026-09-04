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

describe('TeacherDashboardPage review queue entry', () => {
  it('loads submitted reports into a separate review queue and disables an empty entry', async () => {
    const source = await readFile(pagePath, 'utf8');

    expect(source).toContain("'/api/teacher/book-reports?status=submitted'");
    expect(source).toContain('setReviewQueueIds(createReviewQueue(data?.reports ?? []))');
    expect(source).toContain('disabled={reviewQueueIds.length === 0}');
  });
});
