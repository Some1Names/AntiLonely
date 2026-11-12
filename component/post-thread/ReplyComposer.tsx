'use client';

import React, { useState } from 'react';

interface ReplyComposerProps {
  currentUserName: string;
  placeholder?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  submitLabel?: string;
  size?: 'md' | 'sm';
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ReplyComposer({
  currentUserName,
  placeholder,
  onSubmit,
  onCancel,
  autoFocus = false,
  submitLabel = 'ตอบกลับ',
  size = 'md',
  inputRef,
}: ReplyComposerProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  if (size === 'sm') {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 pb-1 w-full"
      >
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full bg-[#d4d4d8] shrink-0"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? `ตอบกลับในชื่อ ${currentUserName}...`}
          className="flex-1 min-w-[120px] h-9 rounded-lg border border-[#e4e4e7] bg-white px-3 text-xs sm:text-[13px] text-[#18181b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-zinc-400"
        />
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button
            type="submit"
            disabled={!value.trim()}
            className="h-9 px-3.5 rounded-lg bg-[#18181b] text-white text-xs sm:text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            {submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-2.5 rounded-lg text-xs sm:text-[13px] text-[#71717a] hover:text-[#18181b] hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#e4e4e7] rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 w-full"
    >
      <div
        aria-hidden="true"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#d4d4d8] shrink-0"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? `ตอบกลับในชื่อ ${currentUserName}...`}
        className="flex-1 min-w-0 h-[38px] sm:h-[42px] rounded-lg border border-[#e4e4e7] bg-white px-3 sm:px-3.5 text-sm text-[#18181b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-zinc-400"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="h-[38px] px-3 sm:px-4 rounded-lg bg-[#18181b] text-white text-xs sm:text-sm font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 whitespace-nowrap"
      >
        {submitLabel}
      </button>
    </form>
  );
}

