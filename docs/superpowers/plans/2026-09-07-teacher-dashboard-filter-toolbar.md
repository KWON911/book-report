# 교사 대시보드 필터 도구막대 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 교사 대시보드의 필터를 밀도 있게 정렬하고 검토 대기 진입점을 같은 도구막대 안에서 눈에 띄게 제공한다.

**Architecture:** 기존 `TeacherDashboardPage`의 상태와 API 요청은 유지한다. 필터와 검토 대기 버튼만 하나의 반응형 Tailwind 도구막대로 재구성하며, 대기열 수가 없을 때도 버튼 위치를 유지한 채 비활성 상태를 명확히 보여 준다. Node 기반 Vitest 환경에서는 페이지 소스 계약 테스트로 배치와 접근성 속성을 회귀 검증한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest 4

## Global Constraints

- 상태·학급·학생 필터의 값, 조회, 정렬 로직을 변경하지 않는다.
- `검토 대기` 버튼의 현재 라우팅과 빈 대기열 비활성 동작을 변경하지 않는다.
- 넓은 화면에서는 필터가 전체 폭을 균등 점유하지 않으며, 검토 대기는 도구막대의 오른쪽 끝에 배치한다.
- 좁은 화면에서는 가로 스크롤 없이 필터가 줄바꿈되고 검토 대기 버튼은 전체 폭을 사용한다.
- 기존 색상 토큰(`forest`, `paper-raised`, `line`)만 사용하고, 키보드 포커스가 보이게 유지한다.
- 학생 화면·API·스키마는 수정하지 않는다.

---

## File Structure

- `app/teacher/dashboard/page.tsx` — 기존 필터·검토 대기 제어를 반응형 도구막대 구조 및 스타일로 바꾼다.
- `__tests__/teacher-review-queue-page.test.ts` — 기존 대기열 계약 테스트에 도구막대 구조·반응형·비활성 접근성 계약을 추가한다.

### Task 1: 압축형 필터·검토 대기 도구막대

**Files:**
- Modify: `app/teacher/dashboard/page.tsx`
- Modify: `__tests__/teacher-review-queue-page.test.ts`

**Interfaces:**
- Consumes: 기존 `statusFilter`, `classFilter`, `studentFilter`, `reviewQueueIds`, `reviewQueueHref` 및 `router`.
- Produces: 넓은 화면에서는 내용 기준 폭 필터와 오른쪽 강조 검토 버튼, 좁은 화면에서는 줄바꿈 필터와 전체 폭 검토 버튼.

- [ ] **Step 1: 도구막대 계약 테스트를 먼저 추가한다**

`TeacherDashboardPage review queue entry` 설명 블록에 다음 테스트를 추가한다.

```ts
it('uses a compact responsive toolbar and keeps the review queue entry prominent', async () => {
  const source = await readFile(pagePath, 'utf8');

  expect(source).toContain('flex flex-wrap items-center gap-2 rounded border border-line bg-paper-raised p-2 mb-4');
  expect(source).toContain('w-full sm:w-[8.5rem]');
  expect(source).toContain('w-full sm:w-[10rem]');
  expect(source).toContain('sm:ml-auto');
  expect(source).toContain('w-full sm:w-auto bg-forest text-paper-raised');
  expect(source).toContain('focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest');
  expect(source).toContain('aria-label="검토 대기 독서록 0건"');
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run __tests__/teacher-review-queue-page.test.ts`

Expected: 새 도구막대 계약 테스트가 실패한다. 기존 대기열 계약 테스트는 통과한다.

- [ ] **Step 3: 대시보드 도구막대를 최소 변경으로 구현한다**

현재 필터 행과 그 직후의 검토 대기 버튼을 하나의 도구막대로 대체한다. 필터에는 다음 폭 클래스를 적용한다.

```tsx
<div className="flex flex-wrap items-center gap-2 rounded border border-line bg-paper-raised p-2 mb-4">
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full sm:w-[8.5rem] border border-line bg-paper-raised text-ink rounded px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
  >
```

학급과 학생 선택 상자의 `className`은 같은 제어 스타일에 `w-full sm:w-[10rem]`을 사용한다. 기존 `disabled={studentOptions.length === 0}`은 유지한다.

검토 버튼에는 버튼 오른쪽 정렬과 강조 스타일을 적용한다. 기존 `onClick`의 대기열 URL과 `disabled` 조건은 그대로 유지한다.

```tsx
<button
  onClick={() =>
    router.push(
      `/teacher/reports/${reviewQueueIds[0]}${reviewQueueHref(reviewQueueIds, 0)}`
    )
  }
  disabled={reviewQueueIds.length === 0}
  aria-label={`검토 대기 독서록 ${reviewQueueIds.length}건`}
  className="w-full sm:w-auto sm:ml-auto bg-forest text-paper-raised px-4 py-2 rounded font-medium hover:opacity-90 disabled:bg-paper-raised disabled:text-ink-soft disabled:border disabled:border-line disabled:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
>
  검토 대기 <span className="font-semibold">{reviewQueueIds.length}건</span> →
</button>
```

`aria-label` 테스트는 실제 JSX 템플릿 리터럴과 맞추도록 아래로 수정한다.

```ts
expect(source).toContain('aria-label={`검토 대기 독서록 ${reviewQueueIds.length}건`}');
```

- [ ] **Step 4: 도구막대 계약 테스트를 통과시킨다**

Run: `npx vitest run __tests__/teacher-review-queue-page.test.ts`

Expected: 대기열 계약과 새 도구막대 계약을 포함한 이 파일의 모든 테스트가 통과한다.

- [ ] **Step 5: 전체 회귀 테스트와 타입 검사를 실행한다**

Run: `npm run test`

Expected: 모든 Vitest 테스트가 통과한다.

Run: `npx tsc --noEmit`

Expected: 오류 없이 종료한다.

- [ ] **Step 6: 변경을 커밋한다**

```bash
git add app/teacher/dashboard/page.tsx __tests__/teacher-review-queue-page.test.ts
git commit -m "style: compact teacher dashboard filters"
```

## Self-Review

- Spec coverage: Task 1은 넓은/좁은 화면 레이아웃, 필터 밀도, 검토 대기 강조·비활성 표현, 포커스 표시, 기존 동작 보존을 모두 다룬다.
- Placeholder scan: 미결정 값이나 후속 구현 표시는 없다.
- Type consistency: 기존 React 상태·라우팅 함수만 사용하며 새 타입·API가 없다.
