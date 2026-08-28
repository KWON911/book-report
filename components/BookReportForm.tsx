'use client';

import { useState } from 'react';
import { BookReport } from '@/lib/types';
import { REPORT_CATEGORIES } from '@/lib/report-categories';

export function BookReportForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: Partial<BookReport>;
  onSave: (
    data: {
      title: string;
      author: string;
      categories: string[];
      content: string;
    },
    status: 'draft' | 'submitted'
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [author, setAuthor] = useState(initialData?.author ?? '');
  const [categories, setCategories] = useState<string[]>(initialData?.categories ?? []);
  const [content, setContent] = useState(initialData?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(category: string) {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  async function handleSave(status: 'draft' | 'submitted') {
    setSaving(true);
    setError(null);
    try {
      await onSave({ title, author, categories, content }, status);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : '저장 중 오류가 발생했습니다.');
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
          <p className="text-base mt-1">{initialData.teacher_comment}</p>
        </div>
      )}
      {initialData?.status === 'approved' && (
        <div className="border border-brass bg-brass-soft p-3 rounded text-brass">
          이미 선생님이 확인한 독서록이에요. 여기서 저장하면 다시 검토를 받아야 해요.
        </div>
      )}
      {error && (
        <div className="border border-plum bg-plum-soft p-3 rounded text-plum text-base">
          {error}
        </div>
      )}
      <label className="flex flex-col gap-1 text-base text-ink-soft">
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
      <label className="flex flex-col gap-1 text-base text-ink-soft">
        지은이
        <input
          placeholder="예: 생텍쥐페리"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={inputClass}
          disabled={saving}
        />
      </label>
      <div className="flex flex-col gap-1 text-base text-ink-soft">
        <div className="flex items-center gap-2">
          무엇을 써볼까요?
          <span className="text-sm bg-forest text-paper-raised rounded-full px-2 py-0.5">
            중복 체크 가능!
          </span>
        </div>
        <div className={`${inputClass} flex flex-wrap gap-x-4 gap-y-2`}>
          {REPORT_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggleCategory(category)}
                disabled={saving}
                className="accent-forest"
              />
              {category}
            </label>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1 text-base text-ink-soft">
        내용
        <textarea
          placeholder="위에서 고른 것들에 대해 자유롭게 써 보세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`${inputClass} min-h-[160px]`}
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
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="ml-auto text-base text-ink-soft hover:underline disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}
