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

  const inputClass =
    'border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest';

  return (
    <div className="card flex flex-col gap-4 max-w-lg p-6">
      {initialData?.status === 'rejected' && initialData?.teacher_comment && (
        <div className="border border-plum bg-plum-soft p-3 rounded text-plum">
          <p className="font-medium">선생님 말씀</p>
          <p className="text-sm mt-1">{initialData.teacher_comment}</p>
        </div>
      )}
      {error && (
        <div className="border border-plum bg-plum-soft p-3 rounded text-plum text-sm">
          {error}
        </div>
      )}
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        책 제목
        <input
          placeholder="예: 어린 왕자"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
          disabled={saving}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        지은이
        <input
          placeholder="예: 생텍쥐페리"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        줄거리
        <textarea
          placeholder="어떤 이야기였나요?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={`${inputClass} min-h-[100px]`}
          disabled={saving}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-soft">
        느낌/감상
        <textarea
          placeholder="읽고 나서 어떤 생각이 들었나요?"
          value={impression}
          onChange={(e) => setImpression(e.target.value)}
          className={`${inputClass} min-h-[100px]`}
          disabled={saving}
        />
      </label>
      <div className="flex gap-2 pt-1">
        <button
          disabled={saving || !title}
          onClick={() => handleSave('draft')}
          className="border border-line bg-paper-raised text-ink px-4 py-2 rounded disabled:opacity-50 hover:bg-slate-soft"
        >
          임시저장
        </button>
        <button
          disabled={saving || !title}
          onClick={() => handleSave('submitted')}
          className="bg-forest text-paper-raised px-4 py-2 rounded disabled:opacity-50 hover:opacity-90"
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
