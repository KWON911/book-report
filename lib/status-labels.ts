import { BookReport } from './types';

// Kid-friendly wording — these show up on the student's own reading log.
export const STATUS_LABEL: Record<BookReport['status'], string> = {
  draft: '쓰는 중',
  submitted: '제출완료',
  approved: '참 잘했어요',
  rejected: '다시 써보아요',
};

// Tailwind text/border color classes for the .stamp component — one per status.
export const STATUS_STAMP_CLASS: Record<BookReport['status'], string> = {
  draft: 'text-slate',
  submitted: 'text-brass',
  approved: 'text-forest',
  rejected: 'text-plum',
};
