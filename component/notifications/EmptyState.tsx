import React from 'react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({
  message = 'ยังไม่มีการแจ้งเตือนในหมวดหมู่นี้',
  description = 'เมื่อมีกิจกรรมใหม่ๆ เช่น การตอบกลับหรือการกล่าวถึง จะแสดงขึ้นที่นี่',
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-xs">
      <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-zinc-900">{message}</h3>
      <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
