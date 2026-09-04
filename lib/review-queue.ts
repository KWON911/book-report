import { BookReport } from '@/lib/types';

export type ReviewQueuePosition = {
  ids: string[];
  index: number;
  previousId: string | null;
  nextId: string | null;
};

export function createReviewQueue(
  reports: Pick<BookReport, 'id' | 'status' | 'submitted_at' | 'created_at'>[],
): string[] {
  return reports
    .filter((report) => report.status === 'submitted')
    .sort((a, b) => {
      const aTime = a.submitted_at ?? a.created_at;
      const bTime = b.submitted_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    })
    .map((report) => report.id);
}

export function parseReviewQueue(
  queue: string | null,
  index: string | null,
  currentId: string,
): ReviewQueuePosition | null {
  if (!queue || !index || !currentId) return null;

  const ids = queue.split(',');
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return null;
  if (!/^-?\d+$/.test(index)) return null;

  const parsedIndex = Number(index);
  if (!Number.isSafeInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= ids.length) return null;
  if (ids[parsedIndex] !== currentId) return null;

  return {
    ids,
    index: parsedIndex,
    previousId: ids[parsedIndex - 1] ?? null,
    nextId: ids[parsedIndex + 1] ?? null,
  };
}

export function reviewQueueHref(ids: string[], index: number): string {
  return `?queue=${encodeURIComponent(ids.join(','))}&index=${index}`;
}
