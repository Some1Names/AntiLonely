'use client';

import React, { useState } from 'react';
import Icon from '@/component/Icon';
import {
  avatarClass,
  disabledButtonClass,
  indexCardClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/styles';

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
          className={avatarClass.replace('size-9', 'size-7')}
        >
          <Icon name="user" className="size-3.5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? `ตอบกลับในชื่อ ${currentUserName}...`}
          className={`flex-1 min-w-[120px] h-9 px-3! py-0! ${inputClass} text-xs! sm:text-[13px]!`}
        />
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button
            type="submit"
            disabled={!value.trim()}
            className={`h-9 px-3.5 ${primaryButtonClass} ${disabledButtonClass} text-xs! sm:text-[13px]! cursor-pointer shrink-0 whitespace-nowrap`}
          >
            {submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`h-9 px-2.5 ${secondaryButtonClass} text-xs! sm:text-[13px]! cursor-pointer shrink-0 whitespace-nowrap`}
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
      className={`${indexCardClass} p-3 sm:p-4 flex items-center gap-2 sm:gap-3 w-full`}
    >
      <div
        aria-hidden="true"
        className={avatarClass.replace('size-9', 'size-8 sm:size-9')}
      >
        <Icon name="user" className="size-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? `ตอบกลับในชื่อ ${currentUserName}...`}
        className={`flex-1 min-w-0 h-[38px] sm:h-[42px] py-0! ${inputClass}`}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className={`h-[38px] px-3 sm:px-4 ${primaryButtonClass} ${disabledButtonClass} text-xs! sm:text-sm! cursor-pointer shrink-0 whitespace-nowrap`}
      >
        {submitLabel}
      </button>
    </form>
  );
}

