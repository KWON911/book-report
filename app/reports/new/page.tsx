'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStudent, clearStudent } from '@/lib/student-session';
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
      const body = await res.json().catch(() => ({}));
      if (body?.error === 'STALE_STUDENT') {
        clearStudent();
        throw new Error(body.message ?? '학생 정보를 찾을 수 없어요. 다시 로그인해주세요.');
      }
      throw new Error('저장 중 오류가 발생했습니다.');
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
