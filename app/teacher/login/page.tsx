'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError('비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      router.push('/teacher/dashboard');
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full flex justify-center items-center p-6">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 max-w-sm w-full p-6">
        <div>
          <p className="eyebrow mb-1">선생님 전용</p>
          <h1 className="text-2xl">교사 로그인</h1>
        </div>
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          비밀번호
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest"
            required
            disabled={loading}
          />
        </label>
        {error && <p className="text-plum text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-forest text-paper-raised py-2 rounded disabled:opacity-50 hover:opacity-90"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </main>
  );
}
