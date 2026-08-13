'use client';

import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { StatusStamp } from '@/components/StatusStamp';
import { TrashIcon } from '@/components/TrashIcon';
import { formatDate } from '@/lib/format-date';

type TeacherReport = BookReport & {
  student: { id: string; name: string; number: number; class: { name: string } };
};

export function TeacherReportList({
  reports,
  onReportDeleted,
}: {
  reports: TeacherReport[];
  onReportDeleted: (reportId: string) => void;
}) {
  const router = useRouter();

  if (reports.length === 0) {
    return <p className="text-ink-soft">표시할 독서록이 없습니다.</p>;
  }

  async function handleDeleteReport(e: React.MouseEvent, reportId: string) {
    e.stopPropagation();
    if (!confirm('이 독서록을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;

    const res = await fetch(`/api/teacher/book-reports/${reportId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onReportDeleted(reportId);
    } else {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="p-3 eyebrow font-medium">학급</th>
            <th className="p-3 eyebrow font-medium">이름</th>
            <th className="p-3 eyebrow font-medium">번호</th>
            <th className="p-3 eyebrow font-medium">제목</th>
            <th className="p-3 eyebrow font-medium">날짜</th>
            <th className="p-3 eyebrow font-medium">상태</th>
            <th className="p-3 eyebrow font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b border-line last:border-0 cursor-pointer hover:bg-slate-soft"
              onClick={() => router.push(`/teacher/reports/${report.id}`)}
            >
              <td className="p-3 text-sm">{report.student.class.name}</td>
              <td className="p-3 text-sm">{report.student.name}</td>
              <td className="p-3 text-sm">{report.student.number}</td>
              <td className="p-3 text-sm">{report.title}</td>
              <td className="p-3 text-sm whitespace-nowrap">
                {formatDate(report.submitted_at ?? report.created_at)}
              </td>
              <td className="p-3 text-sm">
                <StatusStamp status={report.status} />
              </td>
              <td className="p-3 text-sm whitespace-nowrap">
                <button
                  onClick={(e) => handleDeleteReport(e, report.id)}
                  title="독서록 삭제"
                  className="text-plum hover:opacity-70 p-1"
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
