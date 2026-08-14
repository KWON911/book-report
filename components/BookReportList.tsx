import { BookReport } from '@/lib/types';
import { StatusStamp } from '@/components/StatusStamp';
import { formatDate } from '@/lib/format-date';

export function BookReportList({
  reports,
  onEdit,
}: {
  reports: BookReport[];
  onEdit: (id: string) => void;
}) {
  if (reports.length === 0) {
    return <p className="text-ink-soft">아직 작성한 독서록이 없어요. 위 버튼으로 첫 장을 채워보세요.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reports.map((report) => (
        <li
          key={report.id}
          className="card p-4 flex justify-between items-start gap-3 cursor-pointer hover:-translate-y-0.5 transition-transform"
          onClick={() => onEdit(report.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{report.title}</p>
            <p className="text-sm text-ink-soft mt-1">
              {formatDate(report.submitted_at ?? report.created_at)}
              {report.submitted_at ? ' 제출' : ' 작성'}
            </p>
            {report.status === 'rejected' && report.teacher_comment && (
              <p className="text-base text-plum mt-1">
                선생님 말씀: {report.teacher_comment}
              </p>
            )}
          </div>
          <StatusStamp status={report.status} />
        </li>
      ))}
    </ul>
  );
}
