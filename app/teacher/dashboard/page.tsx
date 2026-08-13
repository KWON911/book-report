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
  const [studentQuery, setStudentQuery] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const query = studentQuery.trim();
  const visibleReports = query
    ? reports.filter(
        (r) => r.student.name.includes(query) || String(r.student.number) === query
      )
    : reports;

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-baseline mb-6">
          <div>
            <p className="eyebrow mb-1">사서 데스크</p>
            <h1 className="text-2xl">교사 대시보드</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/teacher/classes')}
              className="text-sm border border-line bg-paper-raised text-ink px-3 py-1.5 rounded hover:bg-slate-soft"
            >
              학급 관리
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm border border-line bg-paper-raised text-ink px-3 py-1.5 rounded hover:bg-slate-soft disabled:opacity-50"
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2"
          >
            <option value="">전체 상태</option>
            <option value="submitted">제출됨</option>
            <option value="approved">참 잘했어요</option>
            <option value="rejected">다시 써보아요</option>
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
          <input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="이름 또는 번호로 찾기"
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2"
          />
        </div>
        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : (
          <TeacherReportList reports={visibleReports} onReportDeleted={handleReportDeleted} />
        )}
      </div>
    </main>
  );
}
