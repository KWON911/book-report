'use client';

import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/status-labels';

type TeacherReport = BookReport & {
  student: { name: string; number: number; class: { name: string } };
};

export function TeacherReportList({ reports }: { reports: TeacherReport[] }) {
  const router = useRouter();

  if (reports.length === 0) {
    return <p className="text-gray-500">표시할 독서록이 없습니다.</p>;
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
