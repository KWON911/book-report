'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { TeacherReportList } from '@/components/TeacherReportList';

type TeacherReport = BookReport & {
  student: { name: string; number: number; class: { name: string } };
};

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<TeacherReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
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
  }, [statusFilter, router]);

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">교사 대시보드</h1>
        <button
          onClick={() => {
            localStorage.removeItem('book-report-student');
            router.push('/teacher/login');
          }}
          className="text-sm bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
        >
          로그아웃
        </button>
      </div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border p-2 rounded mb-4"
      >
        <option value="">전체</option>
        <option value="submitted">제출됨</option>
        <option value="approved">승인됨</option>
        <option value="rejected">반려됨</option>
      </select>
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <TeacherReportList reports={reports} />
      )}
    </main>
  );
}
