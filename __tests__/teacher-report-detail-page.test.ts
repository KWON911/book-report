import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const pagePath = path.join(
  process.cwd(),
  'app',
  'teacher',
  'reports',
  '[id]',
  'page.tsx'
);

describe('TeacherReportDetailPage fetch error handling', () => {
  it('routes unauthenticated and unavailable detail responses away from the report view', async () => {
    const source = await readFile(pagePath, 'utf8');

    expect(source).toMatch(
      /\.then\(\(res\) => \{[\s\S]*if \(!res\.ok\) \{[\s\S]*router\.push\(res\.status === 401 \? '\/teacher\/login' : '\/teacher\/dashboard'\);[\s\S]*return;[\s\S]*\}[\s\S]*return res\.json\(\);[\s\S]*\}\)/
    );
  });
});
