'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { StatusStamp } from '@/components/StatusStamp';
import { TrashIcon } from '@/components/TrashIcon';
import { formatDate } from '@/lib/format-date';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    setError(null);

    try {
      const res = await fetch(`/api/teacher/book-reports/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, comment }),
      });

      if (!res.ok) {
        throw new Error('Failed to review report');
      }

      router.push('/teacher/dashboard');
    } catch {
      setError('검토 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/book-reports/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete report');
      }

      router.push('/teacher/dashboard');
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
      setSubmitting(false);
      setConfirmingDelete(false);
    }
  }

  if (loading) return null;
  if (!report) return null;

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.push('/teacher/dashboard')}
          className="text-base text-ink-soft mb-4 hover:underline"
        >
          &lt; 목록으로
        </button>
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl">{report.title}</h1>
          <StatusStamp status={report.status} />
        </div>
        <p className="text-sm text-ink-soft mb-4">
          {formatDate(report.submitted_at ?? report.created_at)}
          {report.submitted_at ? ' 제출' : ' 작성'}
        </p>
        <div className="card space-y-3 mb-5 p-4">
          <p className="text-base">
            <span className="eyebrow mr-1">지은이</span> {report.author || '없음'}
          </p>
          {report.categories && report.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {report.categories.map((c) => (
                <span
                  key={c}
                  className="text-sm bg-forest-soft text-forest rounded-full px-2 py-0.5"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <div>
            <p className="eyebrow mb-1">내용</p>
            <p className="whitespace-pre-wrap text-base">{report.content || '없음'}</p>
          </div>
        </div>
        {error && <p className="text-plum text-base mb-3">{error}</p>}
        <div className="space-y-3">
          <textarea
            placeholder="코멘트 (반려 시 사유 입력)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2 w-full min-h-[100px] focus:outline-none focus:ring-2 focus:ring-forest"
            disabled={submitting}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleReview('approved')}
              disabled={submitting}
              className="bg-forest text-paper-raised px-4 py-2 rounded disabled:opacity-50 hover:opacity-90"
            >
              승인
            </button>
            <button
              onClick={() => handleReview('rejected')}
              disabled={submitting}
              className="bg-brass text-paper-raised px-4 py-2 rounded disabled:opacity-50 hover:opacity-90"
            >
              반려
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={submitting}
              title="독서록 삭제"
              className="ml-auto border border-line bg-paper-raised text-plum p-2 rounded disabled:opacity-50 hover:bg-slate-soft"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="독서록 삭제"
        message="이 독서록을 삭제하시겠습니까? 되돌릴 수 없습니다."
        submitting={submitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </main>
  );
}
