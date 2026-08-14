'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookReport } from '@/lib/types';
import { StatusStamp } from '@/components/StatusStamp';
import { TrashIcon } from '@/components/TrashIcon';
import { formatDate } from '@/lib/format-date';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type TeacherReport = BookReport & {
  student: { id: string; name: string; number: number; class: { name: string } };
};

type SortKey = 'date' | 'name' | 'number';

export function TeacherReportList({
  reports,
  onReportDeleted,
  sortKey,
  sortOrder,
  onSort,
}: {
  reports: TeacherReport[];
  onReportDeleted: (reportId: string) => void;
  sortKey: SortKey;
  sortOrder: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (reports.length === 0) {
    return <p className="text-ink-soft">표시할 독서록이 없습니다.</p>;
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch(`/api/teacher/book-reports/${pendingDeleteId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onReportDeleted(pendingDeleteId);
      setPendingDeleteId(null);
    } else {
      setDeleteError('삭제 중 오류가 발생했습니다.');
    }
    setDeleting(false);
  }

  function requestDelete(e: React.MouseEvent, reportId: string) {
    e.stopPropagation();
    setDeleteError(null);
    setPendingDeleteId(reportId);
  }

  function sortArrow(key: SortKey) {
    const active = sortKey === key;
    const arrow = active && sortOrder === 'desc' ? '↓' : '↑';
    return (
      <span className={active ? 'text-ink' : 'text-ink-soft opacity-50'}>{arrow}</span>
    );
  }

  const sortLabels: Record<SortKey, string> = { number: '번호', name: '이름', date: '날짜' };

  return (
    <>
      {deleteError && (
        <p className="text-plum text-sm p-3 mb-2 card">{deleteError}</p>
      )}

      {/* Mobile: card list, no fixed-width table to squeeze */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex gap-1 mb-1">
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className="text-sm border border-line bg-paper-raised text-ink rounded px-2 py-1 flex items-center gap-1"
            >
              {sortLabels[key]} {sortArrow(key)}
            </button>
          ))}
        </div>
        {reports.map((report) => (
          <div
            key={report.id}
            className="card p-3 cursor-pointer"
            onClick={() => router.push(`/teacher/reports/${report.id}`)}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{report.title}</p>
                <p className="text-sm text-ink-soft">
                  {report.student.class.name} · {report.student.number}번 {report.student.name}
                </p>
                <p className="text-sm text-ink-soft mt-1">
                  {formatDate(report.submitted_at ?? report.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StatusStamp status={report.status} />
                <button
                  onClick={(e) => requestDelete(e, report.id)}
                  title="독서록 삭제"
                  className="text-plum hover:opacity-70 p-1"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="card overflow-x-auto hidden sm:block">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3 eyebrow font-medium whitespace-nowrap">학급</th>
              <th className="p-3 eyebrow font-medium whitespace-nowrap">
                <button onClick={() => onSort('number')} className="flex items-center gap-1 hover:text-ink">
                  번호 {sortArrow('number')}
                </button>
              </th>
              <th className="p-3 eyebrow font-medium whitespace-nowrap">
                <button onClick={() => onSort('name')} className="flex items-center gap-1 hover:text-ink">
                  이름 {sortArrow('name')}
                </button>
              </th>
              <th className="p-3 eyebrow font-medium whitespace-nowrap">제목</th>
              <th className="p-3 eyebrow font-medium whitespace-nowrap">
                <button onClick={() => onSort('date')} className="flex items-center gap-1 hover:text-ink">
                  날짜 {sortArrow('date')}
                </button>
              </th>
              <th className="p-3 eyebrow font-medium whitespace-nowrap">상태</th>
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
                <td className="p-3 text-sm whitespace-nowrap">{report.student.class.name}</td>
                <td className="p-3 text-sm whitespace-nowrap">{report.student.number}</td>
                <td className="p-3 text-sm whitespace-nowrap">{report.student.name}</td>
                <td className="p-3 text-sm max-w-[160px] truncate">{report.title}</td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {formatDate(report.submitted_at ?? report.created_at)}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  <StatusStamp status={report.status} />
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  <button
                    onClick={(e) => requestDelete(e, report.id)}
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

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="독서록 삭제"
        message="이 독서록을 삭제하시겠습니까? 되돌릴 수 없습니다."
        submitting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
