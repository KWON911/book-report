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
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }

  return (
    <main className="p-6 flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm w-full">
        <h1 className="text-xl font-bold mb-2">교사 로그인</h1>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
          disabled={loading}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded disabled:opacity-50 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </main>
  );
}
