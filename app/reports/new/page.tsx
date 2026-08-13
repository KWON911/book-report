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
      router.push('/');
    }
  }, [router]);

  if (!student) {
    return null;
  }

  async function handleSave(
    data: { title: string; author: string; summary: string; impression: string },
    status: 'draft' | 'submitted'
  ) {
    const res = await fetch('/api/book-reports', {
      method: 'POST',
      body: JSON.stringify({ student_id: student!.id, ...data, status }),
    });

    if (!res.ok) {
      throw new Error('Failed to save report');
    }

    router.push('/');
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <p className="eyebrow mb-1">새 대출카드</p>
      <h1 className="text-2xl mb-5">새 독서록 작성</h1>
      <BookReportForm onSave={handleSave} />
    </main>
  );
}
