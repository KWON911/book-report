'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { TeacherReportList } from '@/components/TeacherReportList';

type TeacherReport = BookReport & {
  student: { id: string; name: string; number: number; class: { name: string } };
};

type ClassOption = { id: string; name: string };
type SortKey = 'date' | 'name' | 'number';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<TeacherReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
        setStudentFilter('');
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

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }

  const studentOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; number: number }>();
    for (const r of reports) {
      if (!byId.has(r.student.id)) {
        byId.set(r.student.id, r.student);
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.number - b.number);
  }, [reports]);

  const visibleReports = useMemo(() => {
    const filtered = studentFilter
      ? reports.filter((r) => r.student.id === studentFilter)
      : reports;

    return [...filtered].sort((a, b) => {
      let diff: number;
      if (sortKey === 'name') {
        diff = a.student.name.localeCompare(b.student.name, 'ko');
      } else if (sortKey === 'number') {
        diff = a.student.number - b.student.number;
      } else {
        const aDate = new Date(a.submitted_at ?? a.created_at).getTime();
        const bDate = new Date(b.submitted_at ?? b.created_at).getTime();
        diff = aDate - bDate;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [reports, studentFilter, sortKey, sortOrder]);

  return (
    <main className="page-shell">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-baseline mb-6">
          <div>
            <p className="eyebrow mb-1">선생님 화면</p>
            <h1 className="text-2xl">교사 대시보드</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/teacher/classes')}
              className="text-base border border-line bg-paper-raised text-ink px-3 py-1.5 rounded hover:bg-slate-soft"
            >
              학급 관리
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-base border border-line bg-paper-raised text-ink px-3 py-1.5 rounded hover:bg-slate-soft disabled:opacity-50"
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className="flex flex-nowrap gap-1.5 sm:gap-2 mb-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 min-w-0 border border-line bg-paper-raised text-ink rounded px-2 sm:px-3 py-2 text-sm sm:text-base truncate"
          >
            <option value="">전체 상태</option>
            <option value="submitted">제출됨</option>
            <option value="approved">참 잘했어요</option>
            <option value="rejected">다시 써보아요</option>
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="flex-1 min-w-0 border border-line bg-paper-raised text-ink rounded px-2 sm:px-3 py-2 text-sm sm:text-base truncate"
          >
            <option value="">전체 학급</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="flex-1 min-w-0 border border-line bg-paper-raised text-ink rounded px-2 sm:px-3 py-2 text-sm sm:text-base truncate"
            disabled={studentOptions.length === 0}
          >
            <option value="">전체 학생</option>
            {studentOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number}번 {s.name}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : (
          <TeacherReportList
            reports={visibleReports}
            onReportDeleted={handleReportDeleted}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>
    </main>
  );
}
