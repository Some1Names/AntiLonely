'use client';

import React from 'react';
import Link from 'next/link';

interface NotificationSettingsButtonProps {
  onClick?: () => void;
}

export function NotificationSettingsButton({
  onClick,
}: NotificationSettingsButtonProps) {
  if (onClick) {
    return (
      <div className="text-center pt-2 pb-6">
        <button
          type="button"
          onClick={onClick}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          ตั้งค่าการแจ้งเตือน
        </button>
      </div>
    );
  }

  return (
    <div className="text-center pt-2 pb-6">
      <Link
        href="/profile?tab=notifications"
        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors inline-block"
      >
        ตั้งค่าการแจ้งเตือน
      </Link>
    </div>
  );
}
