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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/students/identify', {
        method: 'POST',
        body: JSON.stringify({ name, className, number: Number(number) }),
      });

      if (!res.ok) {
        setError('입력을 확인해주세요.');
        setLoading(false);
        return;
      }

      const { student } = await res.json();
      saveStudent(student);
      onIdentified(student);
    } catch (err) {
      setError('오류가 발생했습니다.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 max-w-sm p-6">
      <div>
        <p className="eyebrow mb-1">대출카드 작성</p>
        <h1 className="text-2xl">독서록 시작하기</h1>
      </div>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        이름
        <input
          placeholder="예: 홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest"
          required
          disabled={loading}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        학급
        <input
          placeholder="예: 3학년 2반"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest"
          required
          disabled={loading}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        번호
        <input
          placeholder="예: 5"
          type="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
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
        {loading ? '진행 중...' : '시작하기'}
      </button>
    </form>
  );
}
