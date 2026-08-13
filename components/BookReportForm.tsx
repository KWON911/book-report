'use client';

import { useState } from 'react';
import { BookReport } from '@/lib/types';

export function BookReportForm({
  initialData,
  onSave,
}: {
  initialData?: Partial<BookReport>;
  onSave: (
    data: {
      title: string;
      author: string;
      summary: string;
      impression: string;
    },
    status: 'draft' | 'submitted'
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [author, setAuthor] = useState(initialData?.author ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [impression, setImpression] = useState(initialData?.impression ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(status: 'draft' | 'submitted') {
    setSaving(true);
    setError(null);
    try {
      await onSave({ title, author, summary, impression }, status);
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      {initialData?.status === 'rejected' && initialData?.teacher_comment && (
        <div className="bg-red-50 border border-red-300 p-3 rounded text-red-700">
          <p className="font-medium">반려 사유</p>
          <p>{initialData.teacher_comment}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-300 p-3 rounded text-red-700">
          <p>{error}</p>
        </div>
      )}
      <input
        placeholder="책 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded"
        required
        disabled={saving}
      />
      <input
        placeholder="저자"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border p-2 rounded"
        disabled={saving}
      />
      <textarea
        placeholder="줄거리"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        className="border p-2 rounded min-h-[100px]"
        disabled={saving}
      />
      <textarea
        placeholder="느낌/감상"
        value={impression}
        onChange={(e) => setImpression(e.target.value)}
        className="border p-2 rounded min-h-[100px]"
        disabled={saving}
      />
      <div className="flex gap-2">
        <button
          disabled={saving || !title}
          onClick={() => handleSave('draft')}
          className="bg-gray-400 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-500"
        >
          임시저장
        </button>
        <button
          disabled={saving || !title}
          onClick={() => handleSave('submitted')}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700"
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
