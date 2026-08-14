'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
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
        setSelectedStudentIds(new Set());
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

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
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
    const filtered =
      selectedStudentIds.size === 0
        ? reports
        : reports.filter((r) => selectedStudentIds.has(r.student.id));

    return [...filtered].sort((a, b) => {
      const aDate = new Date(a.submitted_at ?? a.created_at).getTime();
      const bDate = new Date(b.submitted_at ?? b.created_at).getTime();
      return dateSort === 'asc' ? aDate - bDate : bDate - aDate;
    });
  }, [reports, selectedStudentIds, dateSort]);

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
        <div className="flex flex-wrap gap-2 mb-3 items-center">
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
        </div>
        {studentOptions.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 items-center card p-3">
            <span className="eyebrow">학생</span>
            {studentOptions.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.has(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="accent-forest"
                />
                {s.number}번 {s.name}
              </label>
            ))}
            {selectedStudentIds.size > 0 && (
              <button
                onClick={() => setSelectedStudentIds(new Set())}
                className="text-xs text-ink-soft hover:underline ml-auto"
              >
                선택 해제
              </button>
            )}
          </div>
        )}
        {loading ? (
          <p className="text-ink-soft">로딩 중...</p>
        ) : (
          <TeacherReportList
            reports={visibleReports}
            onReportDeleted={handleReportDeleted}
            dateSort={dateSort}
            onToggleDateSort={() => setDateSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          />
        )}
      </div>
    </main>
  );
}
