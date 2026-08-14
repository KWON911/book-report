'use client';

import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  return (
    <main className="page-shell">
      <div className="w-full max-w-sm text-center">
        <p className="eyebrow mb-2">우리 반 독서록</p>
        <h1 className="text-4xl mb-10">독서록</h1>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/student')}
            className="bg-forest text-paper-raised py-3 rounded text-lg hover:opacity-90"
          >
            학생이에요
          </button>
          <button
            onClick={() => router.push('/teacher/login')}
            className="border border-line bg-paper-raised text-ink py-3 rounded text-lg hover:bg-slate-soft"
          >
            선생님이에요
          </button>
        </div>
      </div>
    </main>
  );
}
