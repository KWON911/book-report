# 학생용 온라인 독서록 앱

학생이 이름/학급/번호만 입력해 독서록을 작성·제출하고, 교사가 공유 비밀번호로 로그인해 검토(승인/반려)할 수 있는 웹앱입니다.

## 기술 스택

- **Next.js 14+** (App Router, TypeScript)
- **Supabase** (PostgreSQL)
- **Tailwind CSS** (스타일링)
- **Vercel** (호스팅)

## 로컬 개발

### 1. 저장소 클론

```bash
git clone <repository-url>
cd book-report
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음을 입력합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TEACHER_PASSWORD=your-secure-password
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 앱에 접속할 수 있습니다.

### 5. 테스트 실행

```bash
npm run test
```

## 배포 방법 (Vercel)

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 계정 생성
2. 새 프로젝트 생성
3. SQL Editor에서 `supabase/schema.sql` 내용 실행하여 테이블 생성

### 2. Vercel 배포

1. [Vercel](https://vercel.com)에 로그인하고 GitHub 저장소 연결
2. Vercel 프로젝트 설정에서 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `TEACHER_PASSWORD`

### 3. 배포 확인

1. 배포 완료 후 앱 URL에 접속
2. `<도메인>/teacher/login`에서 교사 비밀번호로 로그인 가능한지 확인

## 사용법

### 학생 사용

1. 홈페이지에서 이름, 학급, 번호 입력
2. "새 독서록 작성" 버튼으로 독서록 작성
3. "임시저장" 또는 "제출하기" 선택
4. 반려된 독서록은 "수정하기"로 수정 후 재제출 가능

### 교사 사용

1. `/teacher/login`에서 공유 비밀번호 입력
2. 대시보드에서 제출된 독서록 확인
3. 각 독서록 상세보기에서 "승인" 또는 "반려" 처리
4. 반려 시 코멘트 입력 가능

## 문서

- `docs/superpowers/specs/` - 설계 문서
- `docs/superpowers/plans/` - 구현 계획
