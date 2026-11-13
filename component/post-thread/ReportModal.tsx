'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ReportReason, ReportTargetType } from '@/types/post-thread';
import Icon from '@/component/Icon';
import Paper from '@/component/Paper';
import {
  choiceClass,
  inputClass,
  primaryButtonClass,
  radioClass,
  secondaryButtonClass,
} from '@/lib/styles';

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
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    setSelectedReason('inappropriate');
    setDetails('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocusedElement = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first radio option or close button on open
    const modalElement = modalRef.current;
    if (modalElement) {
      const focusableSelector =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(
        modalElement.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose();
        return;
      }

      if (event.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableSelector =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
        previousFocusedElement.focus();
      }
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
    targetType === 'comment'
      ? 'รายงานความคิดเห็น'
      : targetType === 'room'
        ? 'รายงานห้อง'
        : 'รายงานกระทู้';
  const modalDescription =
    targetType === 'comment'
      ? 'ระบุเหตุผลที่ต้องการรายงานความคิดเห็นนี้ให้ทีมงานตรวจสอบ'
      : targetType === 'room'
        ? 'ระบุเหตุผลที่ต้องการรายงานห้องนี้ให้ทีมงานตรวจสอบ'
        : 'ระบุเหตุผลที่ต้องการรายงานกระทู้นี้ให้ทีมงานตรวจสอบ';

  return (
    <div
      className="fixed inset-0 z-50 flex overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-[440px] motion-safe:animate-sheet-drop"
      >
        <Paper>
        <div className="flex items-center justify-between gap-2">
          <h2
            id="report-modal-title"
            className="pr-10 font-display text-2xl font-semibold"
          >
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="ปิดหน้าต่างรายงาน"
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-butter hover:text-ink cursor-pointer"
          >
            <Icon name="x" className="size-5" />
          </button>
        </div>

        <p className="text-sm text-ink-soft mt-1.5 mb-4">
          {modalDescription}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-2">
            {REPORT_REASON_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`${choiceClass} items-center`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={selectedReason === option.value}
                  onChange={() => setSelectedReason(option.value)}
                  className={radioClass}
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
              className={`resize-none ${inputClass}`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className={`h-9 px-4 ${secondaryButtonClass} cursor-pointer`}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`h-9 px-4 ${primaryButtonClass} cursor-pointer`}
            >
              ส่งรายงาน
            </button>
          </div>
        </form>
        </Paper>
      </div>
    </div>
  );
}
