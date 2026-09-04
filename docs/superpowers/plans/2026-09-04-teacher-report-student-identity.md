# 교사 독서록 상세 학생 식별 정보 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교사가 독서록 상세 화면에서 작성 학생의 학급·번호·이름을 즉시 확인할 수 있게 한다.

**Architecture:** 교사용 상세 조회 API를 새로 두어 교사 세션을 검증하고 독서록에 학생·학급 관계를 포함해 반환한다. 교사용 상세 페이지는 이 응답과 전용 타입을 사용해 제목 아래와 본문 카드 안에 서로 역할이 다른 학생 식별 정보를 표시한다. 학생용 상세 API와 데이터베이스 스키마는 그대로 유지한다.

**Tech Stack:** Next.js 16 App Router route handlers, React 19, TypeScript, Supabase/PostgREST, Vitest 4

## Global Constraints

- 학생용 `GET /api/book-reports/[id]`의 응답과 인증 동작을 바꾸지 않는다.
- 새 교사용 조회는 `verifyTeacherSession(req)`가 `false`이면 JSON 401을 반환한다.
- 학생 정보 형식은 `student: { id, name, number, class: { name } }`로 통일한다.
- 상세 화면은 상단에 `학급 · 번호번 · 이름`, 본문 카드에 `작성 학생  이름 (학급 · 번호번)`을 모두 표시한다.
- 데이터베이스 스키마나 `supabase/schema.sql`은 수정하지 않는다.

---

## File Structure

- `lib/types.ts` — 기존 `BookReport`에 학생과 학급 관계를 포함하는 `TeacherBookReport` 타입을 추가한다.
- `app/api/teacher/book-reports/[id]/route.ts` — 인증된 교사용 단건 조회와 Supabase 관계 조회를 담당하는 새 route handler다.
- `__tests__/api/teacher-report-detail.test.ts` — 새 route handler의 인증 거부와 성공 응답을 격리해 검증한다.
- `app/teacher/reports/[id]/page.tsx` — 교사용 API와 타입을 사용하고, 두 위치에 작성자 식별 정보를 렌더링한다.

### Task 1: 교사용 상세 조회 API와 타입

**Files:**
- Modify: `lib/types.ts`
- Create: `app/api/teacher/book-reports/[id]/route.ts`
- Create: `__tests__/api/teacher-report-detail.test.ts`

**Interfaces:**
- Consumes: `verifyTeacherSession(req: Request): boolean`, `supabaseClient.from('book_report_entries')`
- Produces: `TeacherBookReport`, `GET(req, { params })` returning `{ report: TeacherBookReport }` or `{ error: string }`

- [ ] **Step 1: Write the failing API tests**

```ts
vi.mock('@/lib/supabase', () => ({ supabaseClient: { from: vi.fn() } }));
vi.mock('@/lib/teacher-session', () => ({ verifyTeacherSession: vi.fn() }));

it('rejects an unauthenticated teacher', async () => {
  vi.mocked(verifyTeacherSession).mockReturnValue(false);
  const res = await GET(new Request('http://localhost/api/teacher/book-reports/report-1'), { params: Promise.resolve({ id: 'report-1' }) });
  expect(res.status).toBe(401);
});

it('returns a report with its student and class', async () => {
  vi.mocked(verifyTeacherSession).mockReturnValue(true);
  const single = vi.fn().mockResolvedValue({ data: { id: 'report-1', student: { id: 'student-1', name: '홍길동', number: 12, class: { name: '2학년 3반' } } }, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  vi.mocked(supabaseClient.from).mockReturnValue({ select } as never);
  const res = await GET(new Request('http://localhost/api/teacher/book-reports/report-1'), { params: Promise.resolve({ id: 'report-1' }) });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ report: { student: { name: '홍길동', number: 12, class: { name: '2학년 3반' } } } });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/api/teacher-report-detail.test.ts`

Expected: FAIL because `@/app/api/teacher/book-reports/[id]/route` does not exist.

- [ ] **Step 3: Add the teacher report type**

Append this type after `BookReport` in `lib/types.ts`:

```ts
export interface TeacherBookReport extends BookReport {
  student: { id: string; name: string; number: number; class: { name: string } };
}
```

- [ ] **Step 4: Implement the authenticated relation query**

Create `app/api/teacher/book-reports/[id]/route.ts`:

```ts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyTeacherSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseClient.from('book_report_entries')
    .select('*, student:book_report_students(id, name, number, class:book_report_classes(name))')
    .eq('id', id).single();
  if (error) {
    console.error('GET /api/teacher/book-reports/[id] failed:', error);
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  return NextResponse.json({ report: data });
}
```

- [ ] **Step 5: Run the focused API test to verify it passes**

Run: `npx vitest run __tests__/api/teacher-report-detail.test.ts`

Expected: 2 passing tests: unauthenticated request returns 401; authenticated request includes `student.name`, `student.number`, and `student.class.name`.

- [ ] **Step 6: Commit the API unit**

Run: `git add lib/types.ts app/api/teacher/book-reports/[id]/route.ts __tests__/api/teacher-report-detail.test.ts; git commit -m "feat: add teacher report detail identity API"`

### Task 2: 교사 상세 화면에 학생 식별 정보 표시

**Files:**
- Modify: `app/teacher/reports/[id]/page.tsx`

**Interfaces:**
- Consumes: `TeacherBookReport` and `GET /api/teacher/book-reports/:id` from Task 1
- Produces: a teacher detail screen with student identity in the header and report card

- [ ] **Step 1: Change the page state and fetch target**

Replace the `BookReport` import and state declaration with:

```ts
import { TeacherBookReport } from '@/lib/types';
const [report, setReport] = useState<TeacherBookReport | null>(null);
```

In the `useEffect`, replace the fetch URL with `fetch(`/api/teacher/book-reports/${id}`)`. Keep the existing loading and failed-fetch redirect behavior.

- [ ] **Step 2: Add the concise header identity line**

Insert this paragraph after the title/status div and before the date paragraph:

```tsx
<p className="text-base text-ink-soft mb-1">
  {report.student.class.name} · {report.student.number}번 · {report.student.name}
</p>
```

- [ ] **Step 3: Add the in-context report-card identity line**

As the first child of the `card space-y-3 mb-5 p-4` div, insert:

```tsx
<p className="text-base">
  <span className="eyebrow mr-1">작성 학생</span>
  {report.student.name} ({report.student.class.name} · {report.student.number}번)
</p>
```

Keep the existing `지은이`, category, and content blocks after this new line.

- [ ] **Step 4: Run static checks and the complete regression suite**

Run: `npm run lint && npm run test`

Expected: ESLint exits successfully; Vitest reports all existing tests plus the two new detail API tests as passing.

- [ ] **Step 5: Perform a visual browser check**

Run: `npm run dev`

Open a teacher report detail with a valid teacher session. Confirm the header shows `학급 · 번호번 · 이름`, the card starts with `작성 학생`, and the title, status, date, approval, rejection, and delete controls retain their positions.

- [ ] **Step 6: Commit the UI unit**

Run: `git add app/teacher/reports/[id]/page.tsx; git commit -m "feat: show student identity in teacher report detail"`

## Self-Review

- Spec coverage: Task 1 provides the authenticated joined data without changing the student endpoint or schema; Task 2 provides both agreed display locations and retains review controls.
- Placeholder scan: no unresolved markers or deferred implementation steps remain.
- Type consistency: `TeacherBookReport.student.class.name` is defined in Task 1 and consumed with the same property names in Task 2.
