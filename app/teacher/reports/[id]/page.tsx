'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';

export default function TeacherReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<BookReport | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/book-reports/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReport(data.report);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push('/teacher/dashboard');
      });
  }, [id, router]);

  async function handleReview(decision: 'approved' | 'rejected') {
    if (!report) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/teacher/book-reports/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, comment }),
      });

      if (!res.ok) {
        throw new Error('Failed to review report');
      }

      router.push('/teacher/dashboard');
    } catch (err) {
      alert('검토 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  if (loading) return null;
  if (!report) return null;

  return (
    <main className="p-6 max-w-2xl">
      <button
        onClick={() => router.push('/teacher/dashboard')}
        className="text-blue-600 mb-4 hover:underline"
      >
        &lt; 목록으로
      </button>
      <h1 className="text-xl font-bold mb-4">{report.title}</h1>
      <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded">
        <p>
          <strong>저자:</strong> {report.author || '없음'}
        </p>
        <p>
          <strong>줄거리:</strong>
        </p>
        <p className="whitespace-pre-wrap text-sm">{report.summary || '없음'}</p>
        <p>
          <strong>느낌/감상:</strong>
        </p>
        <p className="whitespace-pre-wrap text-sm">{report.impression || '없음'}</p>
      </div>
      <div className="space-y-3">
        <textarea
          placeholder="코멘트 (반려 시 사유 입력)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border p-2 rounded w-full min-h-[100px]"
          disabled={submitting}
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleReview('approved')}
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-green-700"
          >
            승인
          </button>
          <button
            onClick={() => handleReview('rejected')}
            disabled={submitting}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-red-700"
          >
            반려
          </button>
        </div>
      </div>
    </main>
  );
}
