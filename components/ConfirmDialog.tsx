'use client';

import { useEffect, useState } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  requireText,
  submitting,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  requireText?: string;
  submitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  if (!open) return null;

  const canConfirm = requireText ? typed.trim() === requireText : true;

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-6 z-50"
      onClick={onCancel}
    >
      <div
        className="card p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium mb-2">{title}</h2>
        <p className="text-base text-ink-soft whitespace-pre-line mb-4">{message}</p>
        {requireText && (
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireText}
            className="border border-line bg-paper-raised text-ink rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-forest"
          />
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="border border-line bg-paper-raised text-ink px-4 py-2 rounded hover:bg-slate-soft disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || submitting}
            className="bg-plum text-paper-raised px-4 py-2 rounded disabled:opacity-50 hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
