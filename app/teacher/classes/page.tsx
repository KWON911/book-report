'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/TrashIcon';

type ClassOption = { id: string; name: string };

export default function TeacherClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  function loadClasses() {
    setLoading(true);
    fetch('/api/classes')
      .then((res) => (res.ok ? res.json() : { classes: [] }))
      .then((data) => setClasses(data?.classes ?? []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name: newName }),
      });

      if (res.status === 401) {
        router.push('/teacher/login');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? '학급 추가 중 오류가 발생했습니다.');
        return;
      }

      setNewName('');
      loadClasses();
    } finally {
      setCreating(false);
    }
  }

  async function handleReset(e: React.MouseEvent, cls: ClassOption) {
    e.stopPropagation();

    const typed = prompt(
      `'${cls.name}' 학급의 모든 학생과 독서록이 삭제됩니다. 되돌릴 수 없습니다.\n정말 진행하려면 학급 이름을 정확히 입력하세요.`
    );
    if (typed === null) return;
    if (typed !== cls.name) {
      alert('입력한 학급 이름이 일치하지 않아 취소되었습니다.');
      return;
    }

    setResettingId(cls.id);
    try {
      const res = await fetch(`/api/teacher/classes/${cls.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmName: typed }),
      });
      if (!res.ok) {
        throw new Error('Failed to reset class');
      }
      alert('학급이 초기화되었습니다.');
    } catch (err) {
      alert('학급 초기화 중 오류가 발생했습니다.');
    } finally {
      setResettingId(null);
    }
  }

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/teacher/dashboard')}
          className="text-sm text-ink-soft mb-4 hover:underline"
        >
          &lt; 대시보드로
        </button>
        <p className="eyebrow mb-1">학급 목록</p>
        <h1 className="text-2xl mb-5">학급 관리</h1>

        <form onSubmit={handleCreate} className="card p-4 flex gap-2 mb-6">
          <input
            placeholder="예: 3학년 2반"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest"
            required
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-forest text-paper-raised px-4 py-2 rounded disabled:opacity-50 hover:opacity-90"
          >
            추가
          </button>
        </form>
        {error && <p className="text-plum text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : classes.length === 0 ? (
          <p className="text-ink-soft">아직 등록된 학급이 없어요. 위에서 추가해보세요.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {classes.map((c) => (
              <li
                key={c.id}
                className="px-4 py-3 text-sm flex justify-between items-center cursor-pointer hover:bg-slate-soft"
                onClick={() => router.push(`/teacher/classes/${c.id}`)}
              >
                <span>{c.name}</span>
                <button
                  onClick={(e) => handleReset(e, c)}
                  disabled={resettingId === c.id}
                  title="학급 초기화"
                  className="text-plum hover:opacity-70 p-1 disabled:opacity-50"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
