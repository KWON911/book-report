import { BookReport } from './types';

export const STATUS_LABEL: Record<BookReport['status'], string> = {
  draft: '임시저장',
  submitted: '제출됨',
  approved: '승인됨',
  rejected: '반려됨',
};
