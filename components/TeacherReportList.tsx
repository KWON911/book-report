'use client';

import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/status-labels';

type TeacherReport = BookReport & {
  student: { id: string; name: string; number: number; class: { name: string } };
};

export function TeacherReportList({
  reports,
  onReportDeleted,
  onStudentDeleted,
}: {
  reports: TeacherReport[];
  onReportDeleted: (reportId: string) => void;
  onStudentDeleted: (studentId: string) => void;
}) {
  const router = useRouter();

  if (reports.length === 0) {
    return <p className="text-gray-500">표시할 독서록이 없습니다.</p>;
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

  async function handleDeleteStudent(
    e: React.MouseEvent,
    studentId: string,
    studentName: string
  ) {
    e.stopPropagation();
    if (
      !confirm(
        `'${studentName}' 학생과 이 학생이 작성한 모든 독서록을 삭제하시겠습니까? 되돌릴 수 없습니다.`
      )
    )
      return;

    const res = await fetch(`/api/teacher/students/${studentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onStudentDeleted(studentId);
    } else {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2 text-sm font-medium">학급</th>
            <th className="p-2 text-sm font-medium">이름</th>
            <th className="p-2 text-sm font-medium">번호</th>
            <th className="p-2 text-sm font-medium">제목</th>
            <th className="p-2 text-sm font-medium">상태</th>
            <th className="p-2 text-sm font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/teacher/reports/${report.id}`)}
            >
              <td className="p-2 text-sm">{report.student.class.name}</td>
              <td className="p-2 text-sm">{report.student.name}</td>
              <td className="p-2 text-sm">{report.student.number}</td>
              <td className="p-2 text-sm">{report.title}</td>
              <td className="p-2 text-sm">{STATUS_LABEL[report.status]}</td>
              <td className="p-2 text-sm whitespace-nowrap">
                <button
                  onClick={(e) => handleDeleteReport(e, report.id)}
                  className="text-red-600 hover:underline mr-3"
                >
                  독서록 삭제
                </button>
                <button
                  onClick={(e) =>
                    handleDeleteStudent(e, report.student.id, report.student.name)
                  }
                  className="text-red-800 hover:underline"
                >
                  학생 삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
