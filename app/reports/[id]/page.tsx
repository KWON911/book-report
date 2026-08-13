'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { BookReportForm } from '@/components/BookReportForm';

export default function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<BookReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/book-reports/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReport(data.report);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push('/');
      });
  }, [id, router]);

  async function handleSave(
    data: { title: string; author: string; summary: string; impression: string },
    status: 'draft' | 'submitted'
  ) {
    const res = await fetch(`/api/book-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, status }),
    });

    if (!res.ok) {
      throw new Error('Failed to save report');
    }

    router.push('/');
  }

  if (loading || !report) return null;

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <p className="eyebrow mb-1">대출카드 수정</p>
        <h1 className="text-2xl mb-5">독서록 수정</h1>
        <BookReportForm initialData={report} onSave={handleSave} />
      </div>
    </main>
  );
}
