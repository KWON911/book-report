'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/TrashIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type ClassOption = { id: string; name: string };

export default function TeacherClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ClassOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/teacher/classes/${pendingDelete.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmName: pendingDelete.name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNotice(data?.error ?? '학급 삭제 중 오류가 발생했습니다.');
        return;
      }
      setClasses((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setNotice(`'${pendingDelete.name}' 학급이 삭제되었습니다.`);
    } catch {
      setNotice('학급 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
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
        {notice && (
          <p className="text-sm mb-4 border border-line bg-paper-raised rounded px-3 py-2">
            {notice}
          </p>
        )}

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
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotice(null);
                    setPendingDelete(c);
                  }}
                  title="학급 삭제"
                  className="text-plum hover:opacity-70 p-1"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="학급 삭제"
        message={`'${pendingDelete?.name}' 학급과 소속된 모든 학생, 독서록이 삭제됩니다. 되돌릴 수 없어요.\n정말 진행하려면 학급 이름을 정확히 입력하세요.`}
        confirmLabel="삭제"
        requireText={pendingDelete?.name}
        submitting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
