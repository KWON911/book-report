import { describe, expect, it } from 'vitest';
import { sortReports, updateSortRules, type SortRule } from '@/lib/report-sort';
import type { TeacherBookReport } from '@/lib/types';

function report(id: string, name: string, date: string): TeacherBookReport {
  return {
    id, student_id: id, title: id, author: null, categories: null, content: null,
    status: 'submitted', teacher_comment: null, created_at: date, submitted_at: date,
    student: { id, name, number: 1, class: { name: '1반' } },
  };
}

describe('teacher report sorting', () => {
  it('keeps date descending as the first priority and sorts names within each displayed date', () => {
    const initial: SortRule[] = [{ key: 'date', order: 'desc' }];
    const rules = updateSortRules(initial, 'name');
    expect(rules).toEqual([
      { key: 'date', order: 'desc' },
      { key: 'name', order: 'asc' },
    ]);

    const reports = [
      report('older', '가람', '2026-09-02T12:00:00'),
      report('b', '나래', '2026-09-03T09:00:00'),
      report('a', '가람', '2026-09-03T18:00:00'),
    ];
    expect(sortReports(reports, rules).map((item) => item.id)).toEqual(['a', 'b', 'older']);
    expect(reports.map((item) => item.id)).toEqual(['older', 'b', 'a']);
    expect(sortReports(reports, []).map((item) => item.id)).toEqual(['older', 'b', 'a']);
    expect(updateSortRules(rules, 'name')).toEqual([
      { key: 'date', order: 'desc' },
      { key: 'name', order: 'desc' },
    ]);
  });
});
