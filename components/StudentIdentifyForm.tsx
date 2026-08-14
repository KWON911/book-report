'use client';

import { useEffect, useState } from 'react';
import { Student } from '@/lib/types';
import { saveStudent } from '@/lib/student-session';

type ClassOption = { id: string; name: string };

export function StudentIdentifyForm({
  onIdentified,
}: {
  onIdentified: (student: Student) => void;
}) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/classes')
      .then((res) => (res.ok ? res.json() : { classes: [] }))
      .then((data) => setClasses(data?.classes ?? []))
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/students/identify', {
        method: 'POST',
        body: JSON.stringify({ name, class_id: classId, number: Number(number) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? '입력을 확인해주세요.');
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
        <p className="eyebrow mb-1">독서카드 작성</p>
        <h1 className="text-2xl">독서록 시작하기</h1>
      </div>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        학급
        {classesLoading ? (
          <p className="text-sm text-ink-soft py-2">학급 목록을 불러오는 중...</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-plum py-2">
            아직 등록된 학급이 없어요. 선생님께 학급 등록을 요청해주세요.
          </p>
        ) : (
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest"
            required
            disabled={loading}
          >
            <option value="" disabled>
              학급을 선택하세요
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
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
      {error && <p className="text-plum text-sm">{error}</p>}
      <button
        type="submit"
        className="bg-forest text-paper-raised py-2 rounded disabled:opacity-50 hover:opacity-90"
        disabled={loading || classes.length === 0}
      >
        {loading ? '진행 중...' : '시작하기'}
      </button>
    </form>
  );
}
