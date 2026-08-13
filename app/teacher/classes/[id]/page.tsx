'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/TrashIcon';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDeleteStudent(studentId: string, studentName: string) {
    if (
      !confirm(
        `'${studentName}' 학생과 이 학생이 작성한 모든 독서록을 삭제하시겠습니까? 되돌릴 수 없습니다.`
      )
    )
      return;

    setDeletingId(studentId);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/teacher/classes')}
          className="text-sm text-ink-soft mb-4 hover:underline"
        >
          &lt; 학급 관리로
        </button>
        <p className="eyebrow mb-1">학생 명부</p>
        <h1 className="text-2xl mb-5">{className ?? '학급'}</h1>

        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : students.length === 0 ? (
          <p className="text-ink-soft">아직 이 학급에서 독서록을 작성한 학생이 없어요.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {students.map((s) => (
              <li key={s.id} className="px-4 py-3 text-sm flex justify-between items-center">
                <span>
                  {s.number}번 {s.name}
                </span>
                <button
                  onClick={() => handleDeleteStudent(s.id, s.name)}
                  disabled={deletingId === s.id}
                  title="학생 삭제"
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
