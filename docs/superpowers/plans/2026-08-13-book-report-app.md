# 학생용 온라인 독서록 앱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학생이 이름/학급/번호만으로 독서록을 작성·제출하고, 교사가 공유 비밀번호로 로그인해 검토(승인/반려)할 수 있는 웹앱을 만든다.

**Architecture:** Next.js(App Router) 단일 프로젝트에서 프론트엔드 페이지와 API Route를 함께 구성한다. 데이터는 Supabase(Postgres)에 저장하고, Vercel에 배포한다. 학생은 무인증(이름+학급+번호 조합), 교사는 공유 비밀번호 기반의 간단한 세션 쿠키로 접근한다.

**Tech Stack:** Next.js 14+(App Router, TypeScript), Supabase(Postgres + supabase-js), Vercel 배포, Tailwind CSS(스타일링)

## Global Constraints

- 학생/교사 모두 별도 회원가입 없음 — 스펙에 명시된 대로 무인증 접근 방식만 사용한다
- 데이터 모델은 스펙에 정의된 `classes`, `students`, `book_reports` 3개 테이블만 사용한다 (파일 첨부, 통계 등은 범위 밖)
- 반려(rejected) 상태의 독서록은 학생이 재수정 후 재제출(status → submitted)할 수 있어야 한다
- 소규모(한 교실) 테스트용이므로 별도의 권한 분리/다중 교사 지원은 만들지 않는다

---

### Task 1: 프로젝트 초기 설정 및 Supabase 스키마

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`
- Create: `supabase/schema.sql`
- Create: `.env.local.example`
- Create: `lib/supabase.ts`

**Interfaces:**
- Produces: `lib/supabase.ts`가 export하는 `supabaseClient: SupabaseClient` — 이후 모든 API Route에서 이 클라이언트를 사용한다

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Supabase 클라이언트 라이브러리 설치**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 3: 환경변수 예시 파일 작성**

`.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TEACHER_PASSWORD=change-me
```

- [ ] **Step 4: Supabase 스키마 SQL 작성**

`supabase/schema.sql`:
```sql
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_id uuid not null references classes(id),
  number int not null,
  unique (name, class_id, number)
);

create table book_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  title text not null,
  author text,
  summary text,
  impression text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  teacher_comment text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
```

이 SQL을 Supabase 프로젝트의 SQL Editor에서 직접 실행한다 (마이그레이션 툴 없이 수동 실행).

- [ ] **Step 5: Supabase 클라이언트 작성**

`lib/supabase.ts`:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabaseClient: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

- [ ] **Step 6: 로컬 개발 서버로 기본 페이지 확인**

Run: `npm run dev`
Expected: `http://localhost:3000`에서 Next.js 기본 페이지가 뜬다

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: initial Next.js + Supabase project setup"
```

---

### Task 2: 데이터 타입 정의 및 학생 식별 API

**Files:**
- Create: `lib/types.ts`
- Create: `app/api/students/identify/route.ts`
- Test: `__tests__/api/students-identify.test.ts`

**Interfaces:**
- Consumes: `lib/supabase.ts`의 `supabaseClient`
- Produces:
  - `lib/types.ts`의 `Student { id: string; name: string; class_id: string; number: number }`
  - `lib/types.ts`의 `BookReport { id: string; student_id: string; title: string; author: string | null; summary: string | null; impression: string | null; status: 'draft' | 'submitted' | 'approved' | 'rejected'; teacher_comment: string | null; created_at: string; submitted_at: string | null }`
  - `POST /api/students/identify` — body `{ name: string; className: string; number: number }` → 응답 `{ student: Student }` (없으면 학급/학생을 자동 생성 후 반환)

- [ ] **Step 1: 타입 정의 작성**

`lib/types.ts`:
```typescript
export interface Student {
  id: string;
  name: string;
  class_id: string;
  number: number;
}

export interface BookReport {
  id: string;
  student_id: string;
  title: string;
  author: string | null;
  summary: string | null;
  impression: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  teacher_comment: string | null;
  created_at: string;
  submitted_at: string | null;
}
```

- [ ] **Step 2: 테스트 프레임워크 설치**

```bash
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: 실패하는 테스트 작성**

`__tests__/api/students-identify.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/students/identify/route';

vi.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'class-1', name: '3학년 2반' },
        error: null,
      }),
    }),
  },
}));

describe('POST /api/students/identify', () => {
  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/students/identify', {
      method: 'POST',
      body: JSON.stringify({ className: '3학년 2반', number: 5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 4: 테스트 실행하여 실패 확인**

Run: `npx vitest run __tests__/api/students-identify.test.ts`
Expected: FAIL (route.ts 파일이 없어서 import 에러)

- [ ] **Step 5: API Route 구현**

`app/api/students/identify/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { name, className, number } = body;

  if (!name || !className || !number) {
    return NextResponse.json(
      { error: 'name, className, number are required' },
      { status: 400 }
    );
  }

  let { data: classRow } = await supabaseClient
    .from('classes')
    .select('id, name')
    .eq('name', className)
    .maybeSingle();

  if (!classRow) {
    const { data: newClass, error: classError } = await supabaseClient
      .from('classes')
      .insert({ name: className })
      .select()
      .single();
    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }
    classRow = newClass;
  }

  let { data: studentRow } = await supabaseClient
    .from('students')
    .select('id, name, class_id, number')
    .eq('class_id', classRow.id)
    .eq('name', name)
    .eq('number', number)
    .maybeSingle();

  if (!studentRow) {
    const { data: newStudent, error: studentError } = await supabaseClient
      .from('students')
      .insert({ name, class_id: classRow.id, number })
      .select()
      .single();
    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }
    studentRow = newStudent;
  }

  return NextResponse.json({ student: studentRow });
}
```

- [ ] **Step 6: 테스트 실행하여 통과 확인**

Run: `npx vitest run __tests__/api/students-identify.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts app/api/students/identify/route.ts __tests__/api/students-identify.test.ts
git commit -m "feat: add student identify API and shared types"
```

---

### Task 3: 독서록 CRUD API (학생용)

**Files:**
- Create: `app/api/book-reports/route.ts` (GET: 학생별 목록 조회, POST: 새 독서록 생성)
- Create: `app/api/book-reports/[id]/route.ts` (PATCH: 수정/제출, GET: 단건 조회)
- Test: `__tests__/api/book-reports.test.ts`

**Interfaces:**
- Consumes: `lib/types.ts`의 `BookReport`, `lib/supabase.ts`의 `supabaseClient`
- Produces:
  - `GET /api/book-reports?student_id=<id>` → `{ reports: BookReport[] }`
  - `POST /api/book-reports` — body `{ student_id, title, author, summary, impression, status: 'draft' | 'submitted' }` → `{ report: BookReport }`
  - `PATCH /api/book-reports/[id]` — body `{ title?, author?, summary?, impression?, status?: 'draft' | 'submitted' }` → `{ report: BookReport }` (status가 'submitted'면 submitted_at을 now()로 설정하고, 기존 status가 'rejected'였어도 'submitted'로 전이 가능)

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/api/book-reports.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/book-reports/route';

vi.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'report-1',
          student_id: 'student-1',
          title: '어린 왕자',
          author: '생텍쥐페리',
          summary: '...',
          impression: '...',
          status: 'draft',
          teacher_comment: null,
          created_at: '2026-08-13T00:00:00Z',
          submitted_at: null,
        },
        error: null,
      }),
    }),
  },
}));

describe('POST /api/book-reports', () => {
  it('returns 400 when student_id is missing', async () => {
    const req = new Request('http://localhost/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({ title: '어린 왕자' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates a draft report', async () => {
    const req = new Request('http://localhost/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({
        student_id: 'student-1',
        title: '어린 왕자',
        author: '생텍쥐페리',
        summary: '...',
        impression: '...',
        status: 'draft',
      }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.report.status).toBe('draft');
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run __tests__/api/book-reports.test.ts`
Expected: FAIL (route.ts 없음)

- [ ] **Step 3: 목록/생성 API 구현**

`app/api/book-reports/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseClient
    .from('book_reports')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { student_id, title, author, summary, impression, status } = body;

  if (!student_id || !title) {
    return NextResponse.json(
      { error: 'student_id and title are required' },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    student_id,
    title,
    author: author ?? null,
    summary: summary ?? null,
    impression: impression ?? null,
    status: status ?? 'draft',
  };

  if (insertData.status === 'submitted') {
    insertData.submitted_at = new Date().toISOString();
  }

  const { data, error } = await supabaseClient
    .from('book_reports')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run __tests__/api/book-reports.test.ts`
Expected: PASS

- [ ] **Step 5: 단건 조회/수정 API 구현**

`app/api/book-reports/[id]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseClient
    .from('book_reports')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { title, author, summary, impression, status } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (author !== undefined) updateData.author = author;
  if (summary !== undefined) updateData.summary = summary;
  if (impression !== undefined) updateData.impression = impression;
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'submitted') {
      updateData.submitted_at = new Date().toISOString();
      updateData.teacher_comment = null;
    }
  }

  const { data, error } = await supabaseClient
    .from('book_reports')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
```

재제출 시 `teacher_comment`를 초기화하는 이유: 학생이 반려 사유를 반영해 새로 제출했으므로, 이전 반려 코멘트가 새 제출 건에 그대로 남아있으면 교사가 혼동할 수 있다.

- [ ] **Step 6: 전체 테스트 실행**

Run: `npx vitest run`
Expected: PASS (모든 테스트)

- [ ] **Step 7: Commit**

```bash
git add app/api/book-reports __tests__/api/book-reports.test.ts
git commit -m "feat: add book report CRUD API for students"
```

---

### Task 4: 교사 인증 API (공유 비밀번호)

**Files:**
- Create: `app/api/teacher/login/route.ts`
- Create: `lib/teacher-session.ts`
- Test: `__tests__/api/teacher-login.test.ts`

**Interfaces:**
- Consumes: `process.env.TEACHER_PASSWORD`
- Produces:
  - `POST /api/teacher/login` — body `{ password: string }` → 성공 시 `Set-Cookie: teacher_session=<token>` 헤더와 `{ success: true }`, 실패 시 401
  - `lib/teacher-session.ts`의 `verifyTeacherSession(req: Request): boolean` — 이후 교사 전용 API에서 사용

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/api/teacher-login.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/teacher/login/route';

describe('POST /api/teacher/login', () => {
  beforeEach(() => {
    process.env.TEACHER_PASSWORD = 'test-password';
  });

  it('rejects wrong password', async () => {
    const req = new Request('http://localhost/api/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('accepts correct password and sets cookie', async () => {
    const req = new Request('http://localhost/api/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test-password' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('teacher_session=');
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run __tests__/api/teacher-login.test.ts`
Expected: FAIL (route.ts 없음)

- [ ] **Step 3: 세션 토큰 유틸 구현**

`lib/teacher-session.ts`:
```typescript
import { createHmac } from 'crypto';

const SESSION_SECRET = process.env.TEACHER_PASSWORD ?? 'insecure-default';

export function createTeacherSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex');
  return `${timestamp}.${signature}`;
}

export function verifyTeacherSession(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/teacher_session=([^;]+)/);
  if (!match) return false;

  const [timestamp, signature] = match[1].split('.');
  if (!timestamp || !signature) return false;

  const expectedSignature = createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex');

  return signature === expectedSignature;
}
```

- [ ] **Step 4: 로그인 API 구현**

`app/api/teacher/login/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createTeacherSessionToken } from '@/lib/teacher-session';

export async function POST(req: Request) {
  const body = await req.json();
  const { password } = body;

  if (password !== process.env.TEACHER_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = createTeacherSessionToken();
  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    `teacher_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800`
  );
  return res;
}
```

- [ ] **Step 5: 테스트 실행하여 통과 확인**

Run: `npx vitest run __tests__/api/teacher-login.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/teacher/login lib/teacher-session.ts __tests__/api/teacher-login.test.ts
git commit -m "feat: add teacher shared-password login"
```

---

### Task 5: 교사용 독서록 목록/검토 API

**Files:**
- Create: `app/api/teacher/book-reports/route.ts` (GET: 전체/학급/상태 필터 목록)
- Create: `app/api/teacher/book-reports/[id]/review/route.ts` (PATCH: 승인/반려 처리)
- Test: `__tests__/api/teacher-book-reports.test.ts`

**Interfaces:**
- Consumes: `lib/teacher-session.ts`의 `verifyTeacherSession`, `lib/types.ts`의 `BookReport`
- Produces:
  - `GET /api/teacher/book-reports?class_id=<id?>&status=<status?>` → `{ reports: (BookReport & { student: { name: string; number: number }; class: { name: string } })[] }` (미인증 시 401)
  - `PATCH /api/teacher/book-reports/[id]/review` — body `{ decision: 'approved' | 'rejected'; comment?: string }` → `{ report: BookReport }` (미인증 시 401)

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/api/teacher-book-reports.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { PATCH } from '@/app/api/teacher/book-reports/[id]/review/route';

vi.mock('@/lib/teacher-session', () => ({
  verifyTeacherSession: vi.fn().mockReturnValue(false),
}));

describe('PATCH /api/teacher/book-reports/[id]/review', () => {
  it('rejects unauthenticated requests', async () => {
    const req = new Request('http://localhost/api/teacher/book-reports/1/review', {
      method: 'PATCH',
      body: JSON.stringify({ decision: 'approved' }),
    });
    const res = await PATCH(req, { params: { id: '1' } });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run __tests__/api/teacher-book-reports.test.ts`
Expected: FAIL (route.ts 없음)

- [ ] **Step 3: 목록 API 구현**

`app/api/teacher/book-reports/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function GET(req: Request) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('class_id');
  const status = searchParams.get('status');

  let query = supabaseClient
    .from('book_reports')
    .select('*, student:students(name, number, class_id, class:classes(name))')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (classId) {
    query = query.eq('student.class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
```

- [ ] **Step 4: 승인/반려 API 구현**

`app/api/teacher/book-reports/[id]/review/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { verifyTeacherSession } from '@/lib/teacher-session';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!verifyTeacherSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { decision, comment } = body;

  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json(
      { error: 'decision must be approved or rejected' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseClient
    .from('book_reports')
    .update({ status: decision, teacher_comment: comment ?? null })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
```

- [ ] **Step 5: 테스트 실행하여 통과 확인**

Run: `npx vitest run __tests__/api/teacher-book-reports.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/teacher/book-reports __tests__/api/teacher-book-reports.test.ts
git commit -m "feat: add teacher review API for book reports"
```

---

### Task 6: 학생 홈 화면 (식별 입력 + 목록)

**Files:**
- Create: `app/page.tsx` (학생 홈)
- Create: `components/StudentIdentifyForm.tsx`
- Create: `components/BookReportList.tsx`
- Create: `lib/student-session.ts` (localStorage 기반 학생 정보 저장/조회)

**Interfaces:**
- Consumes: `POST /api/students/identify`, `GET /api/book-reports?student_id=`, `lib/types.ts`의 `Student`, `BookReport`
- Produces:
  - `lib/student-session.ts`의 `saveStudent(student: Student): void`, `getStudent(): Student | null`, `clearStudent(): void`
  - `components/BookReportList.tsx`의 `<BookReportList reports={BookReport[]} onEdit={(id: string) => void} />`

- [ ] **Step 1: 학생 세션 유틸 작성**

`lib/student-session.ts`:
```typescript
import { Student } from './types';

const STORAGE_KEY = 'book-report-student';

export function saveStudent(student: Student): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
}

export function getStudent(): Student | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Student;
}

export function clearStudent(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: 식별 입력 폼 컴포넌트 작성**

`components/StudentIdentifyForm.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Student } from '@/lib/types';
import { saveStudent } from '@/lib/student-session';

export function StudentIdentifyForm({
  onIdentified,
}: {
  onIdentified: (student: Student) => void;
}) {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/students/identify', {
      method: 'POST',
      body: JSON.stringify({ name, className, number: Number(number) }),
    });

    if (!res.ok) {
      setError('입력을 확인해주세요.');
      return;
    }

    const { student } = await res.json();
    saveStudent(student);
    onIdentified(student);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <input
        placeholder="학급 (예: 3학년 2반)"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <input
        placeholder="번호"
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="border p-2 rounded"
        required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">
        시작하기
      </button>
    </form>
  );
}
```

- [ ] **Step 3: 목록 컴포넌트 작성**

`components/BookReportList.tsx`:
```typescript
import { BookReport } from '@/lib/types';

const STATUS_LABEL: Record<BookReport['status'], string> = {
  draft: '임시저장',
  submitted: '제출됨',
  approved: '승인됨',
  rejected: '반려됨',
};

const STATUS_COLOR: Record<BookReport['status'], string> = {
  draft: 'bg-gray-200 text-gray-700',
  submitted: 'bg-blue-200 text-blue-700',
  approved: 'bg-green-200 text-green-700',
  rejected: 'bg-red-200 text-red-700',
};

export function BookReportList({
  reports,
  onEdit,
}: {
  reports: BookReport[];
  onEdit: (id: string) => void;
}) {
  if (reports.length === 0) {
    return <p className="text-gray-500">아직 작성한 독서록이 없어요.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {reports.map((report) => (
        <li
          key={report.id}
          className="border rounded p-3 flex justify-between items-center cursor-pointer"
          onClick={() => onEdit(report.id)}
        >
          <div>
            <p className="font-medium">{report.title}</p>
            {report.status === 'rejected' && report.teacher_comment && (
              <p className="text-sm text-red-600">
                반려 사유: {report.teacher_comment}
              </p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${STATUS_COLOR[report.status]}`}
          >
            {STATUS_LABEL[report.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: 학생 홈 페이지 작성**

`app/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Student, BookReport } from '@/lib/types';
import { getStudent } from '@/lib/student-session';
import { StudentIdentifyForm } from '@/components/StudentIdentifyForm';
import { BookReportList } from '@/components/BookReportList';

export default function HomePage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<BookReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getStudent();
    setStudent(existing);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!student) return;
    fetch(`/api/book-reports?student_id=${student.id}`)
      .then((res) => res.json())
      .then((data) => setReports(data.reports ?? []));
  }, [student]);

  if (loading) return null;

  if (!student) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold mb-4">독서록 작성 시작하기</h1>
        <StudentIdentifyForm onIdentified={setStudent} />
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">{student.name}님의 독서록</h1>
      <button
        onClick={() => router.push('/reports/new')}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        새 독서록 작성
      </button>
      <BookReportList
        reports={reports}
        onEdit={(id) => router.push(`/reports/${id}`)}
      />
    </main>
  );
}
```

- [ ] **Step 5: 개발 서버로 수동 확인**

Run: `npm run dev`
Expected: `http://localhost:3000`에서 이름/학급/번호 입력 폼이 뜨고, 제출 후 목록 화면으로 전환된다 (Supabase 환경변수가 `.env.local`에 설정되어 있어야 함)

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/StudentIdentifyForm.tsx components/BookReportList.tsx lib/student-session.ts
git commit -m "feat: add student home page with identify form and report list"
```

---

### Task 7: 독서록 작성/수정 화면

**Files:**
- Create: `app/reports/new/page.tsx`
- Create: `app/reports/[id]/page.tsx`
- Create: `components/BookReportForm.tsx`

**Interfaces:**
- Consumes: `POST /api/book-reports`, `GET /api/book-reports/[id]`, `PATCH /api/book-reports/[id]`, `lib/student-session.ts`의 `getStudent`
- Produces: `components/BookReportForm.tsx`의 `<BookReportForm initialData?={Partial<BookReport>} onSave={(status: 'draft' | 'submitted') => Promise<void>} />`

- [ ] **Step 1: 폼 컴포넌트 작성**

`components/BookReportForm.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { BookReport } from '@/lib/types';

export function BookReportForm({
  initialData,
  onSave,
}: {
  initialData?: Partial<BookReport>;
  onSave: (
    data: {
      title: string;
      author: string;
      summary: string;
      impression: string;
    },
    status: 'draft' | 'submitted'
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [author, setAuthor] = useState(initialData?.author ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [impression, setImpression] = useState(initialData?.impression ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave(status: 'draft' | 'submitted') {
    setSaving(true);
    await onSave({ title, author, summary, impression }, status);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      {initialData?.status === 'rejected' && initialData?.teacher_comment && (
        <div className="bg-red-50 border border-red-300 p-3 rounded text-red-700">
          <p className="font-medium">반려 사유</p>
          <p>{initialData.teacher_comment}</p>
        </div>
      )}
      <input
        placeholder="책 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <input
        placeholder="저자"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border p-2 rounded"
      />
      <textarea
        placeholder="줄거리"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        className="border p-2 rounded min-h-[100px]"
      />
      <textarea
        placeholder="느낌/감상"
        value={impression}
        onChange={(e) => setImpression(e.target.value)}
        className="border p-2 rounded min-h-[100px]"
      />
      <div className="flex gap-2">
        <button
          disabled={saving || !title}
          onClick={() => handleSave('draft')}
          className="bg-gray-400 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          임시저장
        </button>
        <button
          disabled={saving || !title}
          onClick={() => handleSave('submitted')}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 새 독서록 작성 페이지**

`app/reports/new/page.tsx`:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { getStudent } from '@/lib/student-session';
import { BookReportForm } from '@/components/BookReportForm';

export default function NewReportPage() {
  const router = useRouter();
  const student = getStudent();

  if (!student) {
    router.push('/');
    return null;
  }

  async function handleSave(
    data: { title: string; author: string; summary: string; impression: string },
    status: 'draft' | 'submitted'
  ) {
    await fetch('/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({ student_id: student!.id, ...data, status }),
    });
    router.push('/');
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">새 독서록 작성</h1>
      <BookReportForm onSave={handleSave} />
    </main>
  );
}
```

- [ ] **Step 3: 기존 독서록 수정 페이지**

`app/reports/[id]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { BookReportForm } from '@/components/BookReportForm';

export default function EditReportPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [report, setReport] = useState<BookReport | null>(null);

  useEffect(() => {
    fetch(`/api/book-reports/${params.id}`)
      .then((res) => res.json())
      .then((data) => setReport(data.report));
  }, [params.id]);

  async function handleSave(
    data: { title: string; author: string; summary: string; impression: string },
    status: 'draft' | 'submitted'
  ) {
    await fetch(`/api/book-reports/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, status }),
    });
    router.push('/');
  }

  if (!report) return null;

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">독서록 수정</h1>
      <BookReportForm initialData={report} onSave={handleSave} />
    </main>
  );
}
```

- [ ] **Step 4: 수동 확인 — 반려 → 재제출 흐름**

Run: `npm run dev`
1. 독서록 작성 후 제출
2. (Task 8 완료 전이므로) Supabase 대시보드에서 직접 해당 row의 `status`를 `rejected`로, `teacher_comment`를 임의 문자열로 변경
3. 학생 홈에서 해당 항목 클릭 → 반려 사유가 보이고, 수정 후 "제출하기"를 누르면 status가 다시 `submitted`로 바뀌는지 확인

Expected: 반려 사유 표시, 재제출 후 상태 변경 확인

- [ ] **Step 5: Commit**

```bash
git add app/reports components/BookReportForm.tsx
git commit -m "feat: add book report create/edit pages with resubmit flow"
```

---

### Task 8: 교사 로그인 화면

**Files:**
- Create: `app/teacher/login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/teacher/login`

- [ ] **Step 1: 로그인 페이지 작성**

`app/teacher/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError('비밀번호가 올바르지 않습니다.');
      return;
    }

    router.push('/teacher/dashboard');
  }

  return (
    <main className="p-6 flex justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm w-full">
        <h1 className="text-xl font-bold mb-2">교사 로그인</h1>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          로그인
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: 수동 확인**

Run: `npm run dev`, `http://localhost:3000/teacher/login` 접속
1. 잘못된 비밀번호 입력 → 에러 메시지 확인
2. `.env.local`에 설정한 `TEACHER_PASSWORD`로 로그인 → `/teacher/dashboard`로 이동 확인 (Task 9에서 대시보드 페이지 생성 전까지는 404가 정상)

- [ ] **Step 3: Commit**

```bash
git add app/teacher/login
git commit -m "feat: add teacher login page"
```

---

### Task 9: 교사 대시보드 및 상세보기 화면

**Files:**
- Create: `app/teacher/dashboard/page.tsx`
- Create: `app/teacher/reports/[id]/page.tsx`
- Create: `components/TeacherReportList.tsx`

**Interfaces:**
- Consumes: `GET /api/teacher/book-reports`, `PATCH /api/teacher/book-reports/[id]/review`

- [ ] **Step 1: 목록 컴포넌트 작성**

`components/TeacherReportList.tsx`:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';

type TeacherReport = BookReport & {
  student: { name: string; number: number; class: { name: string } };
};

const STATUS_LABEL: Record<BookReport['status'], string> = {
  draft: '임시저장',
  submitted: '제출됨',
  approved: '승인됨',
  rejected: '반려됨',
};

export function TeacherReportList({ reports }: { reports: TeacherReport[] }) {
  const router = useRouter();

  if (reports.length === 0) {
    return <p className="text-gray-500">표시할 독서록이 없습니다.</p>;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b text-left">
          <th className="p-2">학급</th>
          <th className="p-2">이름</th>
          <th className="p-2">번호</th>
          <th className="p-2">제목</th>
          <th className="p-2">상태</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => (
          <tr
            key={report.id}
            className="border-b cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(`/teacher/reports/${report.id}`)}
          >
            <td className="p-2">{report.student.class.name}</td>
            <td className="p-2">{report.student.name}</td>
            <td className="p-2">{report.student.number}</td>
            <td className="p-2">{report.title}</td>
            <td className="p-2">{STATUS_LABEL[report.status]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: 대시보드 페이지 작성**

`app/teacher/dashboard/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { BookReport } from '@/lib/types';
import { TeacherReportList } from '@/components/TeacherReportList';

type TeacherReport = BookReport & {
  student: { name: string; number: number; class: { name: string } };
};

export default function TeacherDashboardPage() {
  const [reports, setReports] = useState<TeacherReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    fetch(`/api/teacher/book-reports${query}`)
      .then((res) => res.json())
      .then((data) => setReports(data.reports ?? []));
  }, [statusFilter]);

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">교사 대시보드</h1>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border p-2 rounded mb-4"
      >
        <option value="">전체</option>
        <option value="submitted">제출됨</option>
        <option value="approved">승인됨</option>
        <option value="rejected">반려됨</option>
      </select>
      <TeacherReportList reports={reports} />
    </main>
  );
}
```

- [ ] **Step 3: 상세보기 페이지 작성**

`app/teacher/reports/[id]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';

export default function TeacherReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [report, setReport] = useState<BookReport | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch(`/api/book-reports/${params.id}`)
      .then((res) => res.json())
      .then((data) => setReport(data.report));
  }, [params.id]);

  async function handleReview(decision: 'approved' | 'rejected') {
    await fetch(`/api/teacher/book-reports/${params.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, comment }),
    });
    router.push('/teacher/dashboard');
  }

  if (!report) return null;

  return (
    <main className="p-6 max-w-lg">
      <h1 className="text-xl font-bold mb-4">{report.title}</h1>
      <p className="mb-2"><strong>저자:</strong> {report.author}</p>
      <p className="mb-2"><strong>줄거리:</strong> {report.summary}</p>
      <p className="mb-4"><strong>느낌/감상:</strong> {report.impression}</p>
      <textarea
        placeholder="코멘트 (반려 시 사유 입력)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="border p-2 rounded w-full min-h-[80px] mb-4"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleReview('approved')}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          승인
        </button>
        <button
          onClick={() => handleReview('rejected')}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          반려
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 수동 확인 — 전체 흐름 엔드투엔드 테스트**

Run: `npm run dev`
1. 학생 홈에서 독서록 작성 → 제출
2. 교사 로그인 → 대시보드에서 제출된 항목 확인
3. 상세보기에서 반려 처리(코멘트 입력)
4. 학생 홈으로 돌아가 반려된 항목 확인 → 수정 → 재제출
5. 교사 대시보드에서 다시 확인 → 승인 처리
6. 학생 홈에서 승인됨 상태 확인

Expected: 전 과정이 에러 없이 동작하고 상태 전이가 스펙대로 이루어진다

- [ ] **Step 5: Commit**

```bash
git add app/teacher/dashboard app/teacher/reports components/TeacherReportList.tsx
git commit -m "feat: add teacher dashboard and report detail review pages"
```

---

### Task 10: Vercel 배포 설정

**Files:**
- Create: `vercel.json` (필요 시)
- Modify: `README.md`

**Interfaces:**
- Consumes: 없음 (배포 절차 문서화)

- [ ] **Step 1: README에 배포 절차 작성**

`README.md`에 다음 내용 추가:
```markdown
## 배포 방법

1. Supabase 프로젝트 생성 후 `supabase/schema.sql`을 SQL Editor에서 실행
2. Vercel에 이 저장소를 연결
3. Vercel 프로젝트 환경변수에 다음 3개 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `TEACHER_PASSWORD`
4. 배포 후 `<도메인>/teacher/login`에서 교사 비밀번호로 접속 확인
```

- [ ] **Step 2: 로컬에서 프로덕션 빌드 확인**

Run: `npm run build`
Expected: 빌드 에러 없이 성공

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add deployment instructions"
```

- [ ] **Step 4: Vercel 배포 (수동)**

Vercel 대시보드에서 GitHub 저장소 연결 후 환경변수 설정 → 배포. (이 단계는 계정/외부 서비스 연동이 필요하므로 실제 실행은 사용자가 진행)
