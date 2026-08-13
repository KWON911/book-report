import { BookReport } from '@/lib/types';
import { STATUS_LABEL, STATUS_STAMP_CLASS } from '@/lib/status-labels';

export function StatusStamp({ status }: { status: BookReport['status'] }) {
  return (
    <span className={`stamp ${STATUS_STAMP_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
