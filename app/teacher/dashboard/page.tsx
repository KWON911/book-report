'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { TeacherReportList } from '@/components/TeacherReportList';

type TeacherReport = BookReport & {
  student: { id: string; name: string; number: number; class: { name: string } };
};

type ClassOption = { id: string; name: string };

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<TeacherReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resettingClass, setResettingClass] = useState(false);

  useEffect(() => {
    fetch('/api/classes')
      .then((res) => (res.ok ? res.json() : { classes: [] }))
      .then((data) => setClasses(data?.classes ?? []))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (classFilter) params.set('class_id', classFilter);
    const query = params.toString() ? `?${params.toString()}` : '';
    fetch(`/api/teacher/book-reports${query}`)
      .then((res) => {
        if (!res.ok && res.status === 401) {
          router.push('/teacher/login');
          return;
        }
        return res.json();
      })
      .then((data) => {
        setReports(data?.reports ?? []);
        setLoading(false);
      })
      .catch(() => {
        setReports([]);
        setLoading(false);
      });
  }, [statusFilter, classFilter, router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/teacher/logout', { method: 'POST' });
    } finally {
      router.push('/teacher/login');
    }
  }

  function handleReportDeleted(reportId: string) {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  function handleStudentDeleted(studentId: string) {
    setReports((prev) => prev.filter((r) => r.student.id !== studentId));
  }

  async function handleResetClass() {
    const selectedClass = classes.find((c) => c.id === classFilter);
    if (!selectedClass) {
      alert('초기화할 학급을 먼저 선택해주세요.');
      return;
    }

    const typed = prompt(
      `'${selectedClass.name}' 학급의 모든 학생과 독서록이 삭제됩니다. 되돌릴 수 없습니다.\n정말 진행하려면 학급 이름을 정확히 입력하세요.`
    );
    if (typed === null) return;
    if (typed !== selectedClass.name) {
      alert('입력한 학급 이름이 일치하지 않아 취소되었습니다.');
      return;
    }

    setResettingClass(true);
    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmName: typed }),
      });
      if (!res.ok) {
        throw new Error('Failed to reset class');
      }
      setReports((prev) => prev.filter((r) => r.student.class.name !== selectedClass.name));
      alert('학급이 초기화되었습니다.');
    } catch (err) {
      alert('학급 초기화 중 오류가 발생했습니다.');
    } finally {
      setResettingClass(false);
    }
  }

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-baseline mb-6">
          <div>
            <p className="eyebrow mb-1">사서 데스크</p>
            <h1 className="text-2xl">교사 대시보드</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm border border-line bg-paper-raised text-ink px-3 py-1.5 rounded hover:bg-slate-soft disabled:opacity-50"
          >
            로그아웃
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2"
          >
            <option value="">전체 상태</option>
            <option value="submitted">제출됨</option>
            <option value="approved">승인됨</option>
            <option value="rejected">반려됨</option>
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2"
          >
            <option value="">전체 학급</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleResetClass}
            disabled={!classFilter || resettingClass}
            className="ml-auto text-sm bg-plum text-paper-raised px-3 py-2 rounded hover:opacity-90 disabled:opacity-50"
            title={!classFilter ? '학급을 먼저 선택하세요' : undefined}
          >
            학급 초기화
          </button>
        </div>
        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : (
          <TeacherReportList
            reports={reports}
            onReportDeleted={handleReportDeleted}
            onStudentDeleted={handleStudentDeleted}
          />
        )}
      </div>
    </main>
  );
}
