'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { TeacherReportList } from '@/components/TeacherReportList';

type TeacherReport = BookReport & {
  student: { name: string; number: number; class: { name: string } };
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

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">교사 대시보드</h1>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
        >
          로그아웃
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">전체 상태</option>
          <option value="submitted">제출됨</option>
          <option value="approved">승인됨</option>
          <option value="rejected">반려됨</option>
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">전체 학급</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <TeacherReportList reports={reports} />
      )}
    </main>
  );
}
