'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { ReportReason, ReportTargetType } from '@/types/post-thread';

interface ReportModalProps {
  isOpen: boolean;
  targetType?: ReportTargetType;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}

const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  {
    value: 'inappropriate',
    label: 'เนื้อหาไม่เหมาะสม หรือคุกคามผู้อื่น',
  },
  {
    value: 'spam',
    label: 'สแปม หรือโฆษณาชวนเชื่อ',
  },
  {
    value: 'misinformation',
    label: 'ข้อมูลเท็จ หรือสร้างความเข้าใจผิด',
  },
  {
    value: 'other',
    label: 'อื่นๆ (ระบุรายละเอียดเพิ่มเติม)',
  },
];

export function ReportModal({
  isOpen,
  targetType = 'post',
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] =
    useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');

  const handleClose = useCallback(() => {
    setSelectedReason('inappropriate');
    setDetails('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedReason, details.trim());
    setDetails('');
    setSelectedReason('inappropriate');
  };

  const modalTitle =
    targetType === 'comment' ? 'รายงานความคิดเห็น' : 'รายงานกระทู้';
  const modalDescription =
    targetType === 'comment'
      ? 'ระบุเหตุผลที่ต้องการรายงานความคิดเห็นนี้ให้ทีมงานตรวจสอบ'
      : 'ระบุเหตุผลที่ต้องการรายงานกระทู้นี้ให้ทีมงานตรวจสอบ';

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-900/45 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-xl bg-white border border-[#e4e4e7] p-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="report-modal-title"
            className="text-base sm:text-[17px] font-semibold text-[#18181b]"
          >
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="ปิดหน้าต่างรายงาน"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-[13px] text-[#71717a] mt-1.5 mb-3.5">
          {modalDescription}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-2">
            {REPORT_REASON_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  selectedReason === option.value
                    ? 'border-[#18181b] bg-zinc-50 text-[#18181b] font-medium'
                    : 'border-[#e4e4e7] bg-white text-[#18181b] hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={selectedReason === option.value}
                  onChange={() => setSelectedReason(option.value)}
                  className="accent-[#18181b]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
              className="w-full rounded-lg border border-[#e4e4e7] bg-white p-3 text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-zinc-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded-lg border border-[#e4e4e7] bg-white text-sm text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-[#dc2626] text-white text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
            >
              ส่งรายงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
