'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Student, BookReport } from '@/lib/types';
import { getStudent, clearStudent } from '@/lib/student-session';
import { StudentIdentifyForm } from '@/components/StudentIdentifyForm';
import { BookReportList } from '@/components/BookReportList';

export default function HomePage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<BookReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getStudent();
    setStudent(existing);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!student) return;
    fetch(`/api/book-reports?student_id=${student.id}`)
      .then((res) => res.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => setReports([]));
  }, [student]);

  if (loading) return null;

  if (!student) {
    return (
      <main className="min-h-full flex items-center justify-center p-6">
        <StudentIdentifyForm onIdentified={setStudent} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-baseline mb-6">
        <div>
          <p className="eyebrow mb-1">대출카드</p>
          <h1 className="text-2xl">{student.name}님의 독서록</h1>
        </div>
        <button
          onClick={() => {
            clearStudent();
            setStudent(null);
          }}
          className="text-sm text-ink-soft hover:underline"
        >
          다른 학생으로 전환
        </button>
      </div>
      <button
        onClick={() => router.push('/reports/new')}
        className="bg-forest text-paper-raised px-4 py-2 rounded mb-6 hover:opacity-90"
      >
        + 새 독서록 작성
      </button>
      <BookReportList
        reports={reports}
        onEdit={(id) => router.push(`/reports/${id}`)}
      />
    </main>
  );
}
