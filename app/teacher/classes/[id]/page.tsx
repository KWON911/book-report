'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/TrashIcon';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type ClassOption = { id: string; name: string };
type StudentRow = { id: string; name: string; number: number };

export default function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [className, setClassName] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/classes')
        .then((res) => (res.ok ? res.json() : { classes: [] }))
        .then((data: { classes?: ClassOption[] }) =>
          data?.classes?.find((c) => c.id === id)?.name ?? null
        ),
      fetch(`/api/teacher/students?class_id=${id}`)
        .then((res) => {
          if (res.status === 401) {
            router.push('/teacher/login');
            return { students: [] };
          }
          return res.json();
        })
        .then((data) => data?.students ?? []),
    ]).then(([name, studentList]) => {
      setClassName(name);
      setStudents(studentList);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/students/${pendingDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents((prev) => prev.filter((s) => s.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/teacher/classes')}
          className="text-base text-ink-soft mb-4 hover:underline"
        >
          &lt; 학급 관리로
        </button>
        <p className="eyebrow mb-1">학생 명부</p>
        <h1 className="text-2xl mb-5">{className ?? '학급'}</h1>
        {error && <p className="text-plum text-base mb-4">{error}</p>}

        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : students.length === 0 ? (
          <p className="text-ink-soft">아직 이 학급에서 독서록을 작성한 학생이 없어요.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {students.map((s) => (
              <li key={s.id} className="px-4 py-3 text-base flex justify-between items-center">
                <span>
                  {s.number}번 {s.name}
                </span>
                <button
                  onClick={() => {
                    setError(null);
                    setPendingDelete(s);
                  }}
                  title="학생 삭제"
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
        title="학생 삭제"
        message={`'${pendingDelete?.name}' 학생과 이 학생이 작성한 모든 독서록을 삭제하시겠습니까? 되돌릴 수 없습니다.`}
        submitting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
