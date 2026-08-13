import { BookReport } from './types';

export const STATUS_LABEL: Record<BookReport['status'], string> = {
  draft: '임시저장',
  submitted: '제출됨',
  approved: '승인됨',
  rejected: '반려됨',
};

// Tailwind text/border color classes for the .stamp component — one per status.
export const STATUS_STAMP_CLASS: Record<BookReport['status'], string> = {
  draft: 'text-slate',
  submitted: 'text-brass',
  approved: 'text-forest',
  rejected: 'text-plum',
};
