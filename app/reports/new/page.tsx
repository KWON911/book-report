'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStudent } from '@/lib/student-session';
import { Student } from '@/lib/types';
import { BookReportForm } from '@/components/BookReportForm';

export default function NewReportPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);

  useEffect(() => {
    const s = getStudent();
    setStudent(s);
    if (!s) {
      router.push('/student');
    }
  }, [router]);

  if (!student) {
    return null;
  }

  async function handleSave(
    data: { title: string; author: string; categories: string[]; content: string },
    status: 'draft' | 'submitted'
  ) {
    const res = await fetch('/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({ student_id: student!.id, ...data, status }),
    });

    if (!res.ok) {
      throw new Error('Failed to save report');
    }

    router.push('/student');
  }

  return (
    <main className="page-shell">
      <div className="w-full max-w-2xl">
        <p className="eyebrow mb-1">새 독서카드</p>
        <h1 className="text-2xl mb-5">새 독서록 작성</h1>
        <BookReportForm onSave={handleSave} onCancel={() => router.push('/student')} />
      </div>
    </main>
  );
}
