import { describe, expect, it } from 'vitest';
import {
  createReviewQueue,
  parseReviewQueue,
  reviewQueueHref,
} from '@/lib/review-queue';

describe('review queue helpers', () => {
  it('keeps only submitted reports and orders them by submitted time descending', () => {
    expect(createReviewQueue([
      { id: 'draft', status: 'draft', submitted_at: null, created_at: '2026-09-01T00:00:00Z' },
      { id: 'older', status: 'submitted', submitted_at: '2026-09-02T00:00:00Z', created_at: '2026-09-01T00:00:00Z' },
      { id: 'newer', status: 'submitted', submitted_at: '2026-09-03T00:00:00Z', created_at: '2026-09-01T00:00:00Z' },
    ])).toEqual(['newer', 'older']);
  });

  it('returns navigation only when the URL position matches the current report', () => {
    expect(parseReviewQueue('a,b,c', '1', 'b')).toEqual({ ids: ['a', 'b', 'c'], index: 1, previousId: 'a', nextId: 'c' });
    expect(parseReviewQueue('a,b,c', '1', 'a')).toBeNull();
    expect(parseReviewQueue('a,b,c', 'x', 'b')).toBeNull();
  });

  it('marks the first and last queue positions without an invalid neighbor', () => {
    expect(parseReviewQueue('a,b', '0', 'a')).toMatchObject({ previousId: null, nextId: 'b' });
    expect(parseReviewQueue('a,b', '1', 'b')).toMatchObject({ previousId: 'a', nextId: null });
  });

  it('rejects malformed queue positions', () => {
    expect(parseReviewQueue(null, '0', 'a')).toBeNull();
    expect(parseReviewQueue('', '0', 'a')).toBeNull();
    expect(parseReviewQueue('a,a', '0', 'a')).toBeNull();
    expect(parseReviewQueue('a,b', '1.5', 'b')).toBeNull();
    expect(parseReviewQueue('a,b', '-1', 'a')).toBeNull();
    expect(parseReviewQueue('a,b', '2', 'b')).toBeNull();
    expect(parseReviewQueue(',b', '0', '')).toBeNull();
  });

  it('encodes queue IDs and index in a review queue URL', () => {
    expect(reviewQueueHref(['a', 'book two'], 1)).toBe('?queue=a%2Cbook%20two&index=1');
  });
});
