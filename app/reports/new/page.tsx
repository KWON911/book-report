'use client';

import { useRouter } from 'next/navigation';
import { getStudent } from '@/lib/student-session';
import { BookReportForm } from '@/components/BookReportForm';

export default function NewReportPage() {
  const router = useRouter();
  const student = getStudent();

  if (!student) {
    router.push('/');
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
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">새 독서록 작성</h1>
      <BookReportForm onSave={handleSave} />
    </main>
  );
}
