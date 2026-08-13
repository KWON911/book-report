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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded"
        required
        disabled={loading}
      />
      <input
        placeholder="학급 (예: 3학년 2반)"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        className="border p-2 rounded"
        required
        disabled={loading}
      />
      <input
        placeholder="번호"
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="border p-2 rounded"
        required
        disabled={loading}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? '진행 중...' : '시작하기'}
      </button>
    </form>
  );
}
