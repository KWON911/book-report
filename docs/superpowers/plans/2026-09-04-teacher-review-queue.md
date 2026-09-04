# 교사 검토 대기함 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교사가 제출된 독서록을 대기함에서 연속으로 승인·반려하고, 처리 뒤 다음 글로 자동 이동하게 한다.

**Architecture:** 순수 `review-queue` 유틸리티가 제출됨 항목의 정렬·ID 목록·URL 검증·앞뒤 이동 대상을 담당한다. 대시보드는 별도 제출됨 조회로 대기 건수와 URL을 만들고, 교사 상세 화면은 검증된 URL이 있을 때만 대기 위치와 이동 버튼을 보이며 검토 성공 후 다음 목적지로 이동한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgREST, Vitest 4, Tailwind CSS 4

## Global Constraints

- 검토 대기함에는 `status === 'submitted'`인 독서록만 포함하고 제출 시각 내림차순으로 정렬한다.
- 대기 건수는 대시보드의 학급·학생·상태 필터와 무관하게 모든 제출됨 항목을 기준으로 한다.
- 상세 URL은 `queue=<쉼표로 구분한 ID>&index=<0부터 시작하는 위치>` 형식이며, 잘못된 값은 일반 상세 화면으로 안전하게 처리한다.
- 승인·반려 API가 성공한 뒤에만 다음 대기 독서록으로 이동한다.
- 반려 코멘트가 공백이면 API 요청을 보내지 않고 안내를 표시한다.
- 데이터베이스 스키마와 학생 화면은 변경하지 않는다.

---

## File Structure

- `lib/review-queue.ts` — 대기 ID 목록 생성, URL 파싱, 이전·다음 목적지 계산을 담당하는 순수 함수다.
- `__tests__/lib/review-queue.test.ts` — 정렬·필터·유효하지 않은 URL·첫/중간/마지막 항목을 검증한다.
- `app/teacher/dashboard/page.tsx` — 필터와 독립적인 제출 대기 목록을 불러와 대기 건수 버튼을 표시한다.
- `app/teacher/reports/[id]/page.tsx` — 대기 위치와 이동 버튼, 반려 코멘트 검증, 성공 뒤 목적지 이동을 담당한다.
- `__tests__/teacher-review-queue-page.test.ts` — 현재 Node 기반 Vitest 환경에서 상세 페이지의 필수 흐름을 소스 계약으로 회귀 검증한다.

### Task 1: 검토 대기 목록 도메인 유틸리티

**Files:**
- Create: `lib/review-queue.ts`
- Create: `__tests__/lib/review-queue.test.ts`

**Interfaces:**
- Consumes: `{ id: string; status: BookReport['status']; submitted_at: string | null; created_at: string }[]`
- Produces: `createReviewQueue(reports): string[]`, `parseReviewQueue(queue, index, currentId): ReviewQueuePosition | null`, `reviewQueueHref(ids, index): string`

- [ ] **Step 1: Write failing queue tests**

Create `__tests__/lib/review-queue.test.ts` with these cases:

```ts
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
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx vitest run __tests__/lib/review-queue.test.ts`

Expected: FAIL because `@/lib/review-queue` does not exist.

- [ ] **Step 3: Implement the queue helpers**

Create `lib/review-queue.ts` with these interfaces:

```ts
import { BookReport } from '@/lib/types';

export type ReviewQueuePosition = {
  ids: string[];
  index: number;
  previousId: string | null;
  nextId: string | null;
};

export function createReviewQueue(reports: Pick<BookReport, 'id' | 'status' | 'submitted_at' | 'created_at'>[]): string[];
export function parseReviewQueue(queue: string | null, index: string | null, currentId: string): ReviewQueuePosition | null;
export function reviewQueueHref(ids: string[], index: number): string;
```

`createReviewQueue` filters `submitted`, then sorts by `submitted_at ?? created_at` descending. `parseReviewQueue` rejects an empty ID, duplicated IDs, invalid integer index, out-of-range index, and an index whose ID differs from `currentId`. `reviewQueueHref` returns `?queue=${encodeURIComponent(ids.join(','))}&index=${index}`.

- [ ] **Step 4: Run queue tests to verify they pass**

Run: `npx vitest run __tests__/lib/review-queue.test.ts`

Expected: 3 tests pass.

- [ ] **Step 5: Commit the domain unit**

Run: `git add lib/review-queue.ts __tests__/lib/review-queue.test.ts; git commit -m "feat: add teacher review queue helpers"`

### Task 2: 대시보드 검토 대기함 진입

**Files:**
- Modify: `app/teacher/dashboard/page.tsx`

**Interfaces:**
- Consumes: `createReviewQueue(reports)` and `reviewQueueHref(ids, index)` from Task 1
- Produces: a disabled-or-active `검토 대기 n건` button that routes to the first queued report

- [ ] **Step 1: Add a separate queue state and fetch**

Add `const [reviewQueueIds, setReviewQueueIds] = useState<string[]>([]);`. Add a mount-only `useEffect` that fetches `/api/teacher/book-reports?status=submitted`, redirects 401 to `/teacher/login`, and otherwise passes `data?.reports ?? []` to `createReviewQueue`.

```ts
fetch('/api/teacher/book-reports?status=submitted')
  .then((res) => {
    if (!res.ok) {
      if (res.status === 401) router.push('/teacher/login');
      return null;
    }
    return res.json();
  })
  .then((data) => setReviewQueueIds(createReviewQueue(data?.reports ?? [])))
  .catch(() => setReviewQueueIds([]));
```

- [ ] **Step 2: Add the queue button below filters**

Below the existing filter row, render:

```tsx
<button
  onClick={() => router.push(`/teacher/reports/${reviewQueueIds[0]}${reviewQueueHref(reviewQueueIds, 0)}`)}
  disabled={reviewQueueIds.length === 0}
  className="mb-4 border border-line bg-paper-raised text-ink px-3 py-2 rounded disabled:opacity-50 hover:bg-slate-soft"
>
  검토 대기 {reviewQueueIds.length}건
</button>
```

The button must remain independent of `visibleReports`, `statusFilter`, `classFilter`, and `studentFilter`.

- [ ] **Step 3: Add a page-source contract regression test**

Extend `__tests__/teacher-review-queue-page.test.ts` so it reads `app/teacher/dashboard/page.tsx` and asserts the exact submitted query, `createReviewQueue` call, and disabled button condition exist:

```ts
expect(source).toContain("fetch('/api/teacher/book-reports?status=submitted')");
expect(source).toContain('setReviewQueueIds(createReviewQueue(data?.reports ?? []))');
expect(source).toContain('disabled={reviewQueueIds.length === 0}');
```

- [ ] **Step 4: Run focused tests to verify the dashboard integration**

Run: `npx vitest run __tests__/lib/review-queue.test.ts __tests__/teacher-review-queue-page.test.ts`

Expected: all queue unit and dashboard source-contract tests pass.

- [ ] **Step 5: Commit the dashboard unit**

Run: `git add app/teacher/dashboard/page.tsx __tests__/teacher-review-queue-page.test.ts; git commit -m "feat: add teacher review queue entry"`

### Task 3: 상세 화면 연속 검토와 반려 검증

**Files:**
- Modify: `app/teacher/reports/[id]/page.tsx`
- Modify: `__tests__/teacher-review-queue-page.test.ts`

**Interfaces:**
- Consumes: `useSearchParams()` from `next/navigation`, `parseReviewQueue`, `reviewQueueHref`
- Produces: validated previous/next controls and review-success routing

- [ ] **Step 1: Write failing detail-page source-contract tests**

Add tests that read the detail page source and assert:

```ts
expect(source).toContain("const searchParams = useSearchParams();");
expect(source).toContain("parseReviewQueue(searchParams.get('queue'), searchParams.get('index'), id)");
expect(source).toContain("if (decision === 'rejected' && !comment.trim())");
expect(source).toContain("router.push(`/teacher/reports/${queuePosition.nextId}${reviewQueueHref(queuePosition.ids, queuePosition.index + 1)}`)");
expect(source).toContain("router.push('/teacher/dashboard')");
```

- [ ] **Step 2: Run the detail source-contract test to verify it fails**

Run: `npx vitest run __tests__/teacher-review-queue-page.test.ts`

Expected: FAIL because the detail page has no queue parsing, rejection guard, or queue-success routing.

- [ ] **Step 3: Add validated queue state and controls**

Import `useSearchParams`, `parseReviewQueue`, and `reviewQueueHref`. Derive `queuePosition` after `id`:

```ts
const searchParams = useSearchParams();
const queuePosition = parseReviewQueue(searchParams.get('queue'), searchParams.get('index'), id);
```

Below the student identity line, render queue position only when `queuePosition` exists. Render `이전` and `다음` buttons that call `router.push` with the corresponding report ID and `reviewQueueHref`. Disable prior/next controls when their neighbor ID is `null` or `submitting` is true.

- [ ] **Step 4: Guard blank rejection comments and route after successful review**

At the start of `handleReview`, before `setSubmitting(true)`, add:

```ts
if (decision === 'rejected' && !comment.trim()) {
  setError('반려 사유를 입력해 주세요.');
  return;
}
```

After a successful review response, replace the unconditional dashboard route with:

```ts
if (queuePosition?.nextId) {
  router.push(`/teacher/reports/${queuePosition.nextId}${reviewQueueHref(queuePosition.ids, queuePosition.index + 1)}`);
} else {
  router.push('/teacher/dashboard');
}
```

This applies to both approval and rejection; the last item returns to the dashboard.

- [ ] **Step 5: Run focused page tests and the full suite**

Run: `npx vitest run __tests__/teacher-review-queue-page.test.ts && npm run test`

Expected: detail source-contract tests pass and the full Vitest suite has no failures.

- [ ] **Step 6: Commit the detail unit**

Run: `git add app/teacher/reports/[id]/page.tsx __tests__/teacher-review-queue-page.test.ts; git commit -m "feat: support sequential teacher review"`

## Self-Review

- Spec coverage: Task 1 creates the status/ordering/URL rules; Task 2 provides the all-submitted count and entry point; Task 3 provides validated navigation, success-only progression, blank-comment prevention, and last-item return.
- Placeholder scan: no unresolved markers or deferred implementation steps remain.
- Type consistency: Task 1 exports `ReviewQueuePosition`, `createReviewQueue`, `parseReviewQueue`, and `reviewQueueHref`; Tasks 2 and 3 consume those exact names.
