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
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">독서록 수정</h1>
      <BookReportForm initialData={report} onSave={handleSave} />
    </main>
  );
}
