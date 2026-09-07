'use client';

import { useEffect, useRef, useState } from 'react';
import { BookReport } from '@/lib/types';
import { REPORT_CATEGORIES } from '@/lib/report-categories';

export function BookReportForm({
  initialData,
  onSave,
  onCancel,
  draftKey,
}: {
  draftKey: string;
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
  const [preview, setPreview] = useState(false);
  const [storageMessage, setStorageMessage] = useState('자동저장 준비 중…');
  const [recovery, setRecovery] = useState<{ title: string; author: string; categories: string[]; content: string } | null>(null);
  const ready = useRef(false);
  const changed = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.title === 'string' && typeof data.author === 'string' && typeof data.content === 'string' && Array.isArray(data.categories) && data.categories.every((c: unknown) => typeof c === 'string')) {
          // Browser storage is available only after hydration; show the recovered external state.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecovery(data);
        }
      }
      setStorageMessage('입력한 내용은 이 기기에 자동저장돼요.');
    } catch {
      setStorageMessage('자동저장을 사용할 수 없어요. 임시저장 버튼을 눌러 주세요.');
    }
    ready.current = true;
  }, [draftKey]);

  useEffect(() => {
    if (!ready.current || !changed.current || recovery || completed.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ title, author, categories, content }));
      // Reflect the result of the external storage write, not a derived form value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageMessage('이 기기에 자동저장됨 · 다른 기기에서 이어 쓰려면 지금 임시저장을 눌러 주세요.');
    } catch {
      setStorageMessage('자동저장 실패 · 화면을 닫기 전에 임시저장을 눌러 주세요.');
    }
  }, [title, author, categories, content, draftKey, recovery]);

  function toggleCategory(category: string) {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  async function handleSave(status: 'draft' | 'submitted') {
    if (saving) return;
    if (!title.trim() || (status === 'submitted' && !content.trim())) {
      setError('책 제목과 제출할 내용을 확인해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ title, author, categories, content }, status);
      completed.current = true;
      try { localStorage.removeItem(draftKey); } catch { /* Server save succeeded. */ }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : '저장 중 오류가 발생했습니다.');
      setSaving(false);
    }
  }

  const inputClass =
    'border border-line bg-paper-raised text-ink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest';

  return (
    <div className="card flex flex-col gap-4 w-full p-4 sm:p-6" onChange={() => { changed.current = true; }}>
      <p role="status" className="text-sm text-ink-soft">{storageMessage}</p>
      {recovery && (
        <section className="rounded border border-line bg-forest-soft p-3 space-y-2" aria-label="작성 내용 복원">
          <p>이 기기에 저장된 작성 내용이 있어요. 이어 쓸까요?</p>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-11 rounded bg-forest text-paper-raised px-3" onClick={() => {
              setTitle(recovery.title); setAuthor(recovery.author); setCategories(recovery.categories); setContent(recovery.content);
              changed.current = true; setRecovery(null);
            }}>이어서 쓰기</button>
            <button className="min-h-11 rounded border border-line px-3" onClick={() => {
              try { localStorage.removeItem(draftKey); } catch { /* New edits will report storage errors. */ }
              setRecovery(null);
            }}>저장된 내용 버리기</button>
          </div>
        </section>
      )}
      {(initialData?.status === 'rejected' || initialData?.status === 'draft') && initialData?.teacher_comment && (
        <div className="border border-plum bg-plum-soft p-3 rounded text-plum">
          <p className="font-medium">선생님 말씀을 읽고 고쳐 써 보세요</p>
          <p className="text-base mt-1 whitespace-pre-wrap">{initialData.teacher_comment}</p>
          <p className="text-sm mt-2">수정한 뒤 미리보기에서 ‘다시 제출하기’를 눌러 주세요.</p>
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
      <fieldset disabled={saving || !!recovery || preview} className="contents">
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
          className={`${inputClass} min-h-[40dvh] resize-y text-base leading-relaxed`}
          disabled={saving}
        />
      </label>
      </fieldset>
      {preview && (
        <section aria-label="제출 전 미리보기" className="rounded border border-forest bg-forest-soft p-4 space-y-3 break-words">
          <h2 className="text-xl" tabIndex={-1} ref={(element) => { element?.focus(); }}>제출 전 미리보기</h2>
          <p className="font-semibold">{title}</p>
          <p>지은이: {author || '입력하지 않음'}</p>
          <p>{categories.join(' · ')}</p>
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          <button disabled={saving} className="min-h-11 underline" onClick={() => setPreview(false)}>돌아가서 수정하기</button>
        </section>
      )}
      <div className="flex flex-wrap gap-2 border-t border-line pt-3 pb-[env(safe-area-inset-bottom)] [&_button]:min-h-11 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-forest">
        <button
          disabled={saving || !!recovery || !title.trim()}
          onClick={() => handleSave('draft')}
          className="border border-line bg-paper-raised text-ink px-4 py-2 rounded disabled:opacity-50 hover:bg-slate-soft"
        >
          임시저장
        </button>
        <button
          disabled={saving || !!recovery || !title.trim() || !content.trim()}
          onClick={() => preview ? handleSave('submitted') : setPreview(true)}
          className="bg-forest text-paper-raised px-4 py-2 rounded disabled:opacity-50 hover:opacity-90"
        >
          {saving ? '저장 중…' : preview ? (initialData?.teacher_comment ? '다시 제출하기' : '제출하기') : '제출 전 미리보기'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="ml-auto text-base text-ink-soft hover:underline disabled:opacity-50"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
