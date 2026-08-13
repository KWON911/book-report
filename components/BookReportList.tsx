import { BookReport } from '@/lib/types';

const STATUS_LABEL: Record<BookReport['status'], string> = {
  draft: '임시저장',
  submitted: '제출됨',
  approved: '승인됨',
  rejected: '반려됨',
};

const STATUS_COLOR: Record<BookReport['status'], string> = {
  draft: 'bg-gray-200 text-gray-700',
  submitted: 'bg-blue-200 text-blue-700',
  approved: 'bg-green-200 text-green-700',
  rejected: 'bg-red-200 text-red-700',
};

export function BookReportList({
  reports,
  onEdit,
}: {
  reports: BookReport[];
  onEdit: (id: string) => void;
}) {
  if (reports.length === 0) {
    return <p className="text-gray-500">아직 작성한 독서록이 없어요.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {reports.map((report) => (
        <li
          key={report.id}
          className="border rounded p-3 flex justify-between items-start cursor-pointer hover:bg-gray-50"
          onClick={() => onEdit(report.id)}
        >
          <div className="flex-1">
            <p className="font-medium">{report.title}</p>
            {report.status === 'rejected' && report.teacher_comment && (
              <p className="text-sm text-red-600 mt-1">
                반려 사유: {report.teacher_comment}
              </p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${STATUS_COLOR[report.status]}`}
          >
            {STATUS_LABEL[report.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
