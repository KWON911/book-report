import type { TeacherBookReport } from '@/lib/types';
import { formatDate } from '@/lib/format-date';

export type SortKey = 'date' | 'name' | 'number';
export type SortRule = { key: SortKey; order: 'asc' | 'desc' };

export function updateSortRules(rules: SortRule[], key: SortKey): SortRule[] {
  const existing = rules.find((rule) => rule.key === key);
  if (existing) {
    return rules.map((rule): SortRule =>
      rule.key === key ? { ...rule, order: rule.order === 'asc' ? 'desc' : 'asc' } : rule
    );
  }
  return [...rules, { key, order: 'asc' }];
}

export function sortReports<T extends TeacherBookReport>(reports: T[], rules: SortRule[]): T[] {
  return [...reports].sort((a, b) => {
    for (const { key, order } of rules) {
      let diff: number;
      if (key === 'name') {
        diff = a.student.name.localeCompare(b.student.name, 'ko');
      } else if (key === 'number') {
        diff = a.student.number - b.student.number;
      } else {
        diff = formatDate(a.submitted_at ?? a.created_at)
          .localeCompare(formatDate(b.submitted_at ?? b.created_at));
      }
      if (diff !== 0) return order === 'asc' ? diff : -diff;
    }
    return 0;
  });
}
