'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { ReactionItem } from '@/types/post-thread';
import {
  INITIAL_PICKER_EMOJIS,
  REMAINING_PICKER_EMOJIS,
  REACTION_SIZES,
  type ReactionSize,
} from '@/lib/post-thread';
import { getEmojiLabel } from '@/lib/emoji-catalog';
import { computePopoverPosition, type PopoverResult } from '@/lib/popover-position';
import { useIsMobile } from '@/component/useIsMobile';
import { useActiveReactionPicker } from '@/lib/reaction-picker-store';

export { REACTION_SIZES, type ReactionSize };

const emptySubscribe = () => () => {};

export interface ReactionBarProps {
  reactions: ReactionItem[];
  onToggleReaction: (emoji: string) => Promise<void> | void;
  size?: ReactionSize;
  avoidRef?: React.RefObject<HTMLElement | null>;
  pickerId?: string;
}

export function ReactionBar({
  reactions,
  onToggleReaction,
  size = 'md',
  avoidRef,
  pickerId,
}: ReactionBarProps) {
  const currentSize = REACTION_SIZES[size] ?? REACTION_SIZES.md;
  const autoId = useId();
  const id = pickerId || autoId;

  const { isOpen, open, close } = useActiveReactionPicker(id);
  const { isCoarsePointer } = useIsMobile();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [showAllPickerEmojis, setShowAllPickerEmojis] = useState(false);
  const [position, setPosition] = useState<PopoverResult | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Optimistic reactions state synced with props during render
  const [prevReactions, setPrevReactions] = useState<ReactionItem[]>(reactions);
  const [optimisticReactions, setOptimisticReactions] = useState<ReactionItem[]>(reactions);

  if (prevReactions !== reactions) {
    setPrevReactions(reactions);
    setOptimisticReactions(reactions);
  }

  const currentPickerEmojis = useMemo(
    () =>
      showAllPickerEmojis
        ? [...INITIAL_PICKER_EMOJIS, ...REMAINING_PICKER_EMOJIS]
        : INITIAL_PICKER_EMOJIS,
    [showAllPickerEmojis]
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const fallbackWidth = isCoarsePointer
      ? (showAllPickerEmojis ? 580 : 300)
      : (showAllPickerEmojis ? 440 : 230);
    const fallbackHeight = isCoarsePointer ? 64 : 50;

    const popoverWidth = popoverRef.current
      ? popoverRef.current.offsetWidth
      : fallbackWidth;
    const popoverHeight = popoverRef.current
      ? popoverRef.current.offsetHeight
      : fallbackHeight;

    const avoidRect = avoidRef?.current
      ? avoidRef.current.getBoundingClientRect()
      : undefined;

    const pos = computePopoverPosition(
      triggerRect,
      { width: popoverWidth, height: popoverHeight },
      { width: window.innerWidth, height: window.innerHeight },
      { gap: 8, viewportPadding: 12, avoidRect }
    );
    setPosition(pos);
  }, [avoidRef, showAllPickerEmojis, isCoarsePointer]);

  // Measure and compute layout on open (both mobile and desktop)
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      // Focus initial item
      const firstSelectedIndex = currentPickerEmojis.findIndex((char) =>
        optimisticReactions.some((r) => r.emoji === char && r.reactedByMe)
      );
      const initialIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0;
      buttonRefs.current[initialIndex]?.focus();
    }
  }, [isOpen, updatePosition, optimisticReactions, currentPickerEmojis]);

  // Re-measure when expanding/collapsing emojis
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [showAllPickerEmojis, isOpen, updatePosition]);

  // Click/tap outside and scroll dismiss
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent | MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      close();
      setShowAllPickerEmojis(false);
    }

    function handleScroll() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        close();
        setShowAllPickerEmojis(false);
      } else {
        updatePosition();
      }
    }

    function handleResize() {
      updatePosition();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, close, updatePosition]);

  const handleToggle = async (emoji: string) => {
    const previous = optimisticReactions;
    const existingIndex = previous.findIndex((r) => r.emoji === emoji);

    let updated: ReactionItem[];
    if (existingIndex >= 0) {
      const item = previous[existingIndex];
      const nextReacted = !item.reactedByMe;
      const nextCount = nextReacted ? item.count + 1 : Math.max(0, item.count - 1);
      if (nextCount === 0) {
        updated = previous.filter((_, idx) => idx !== existingIndex);
      } else {
        updated = previous.map((r, idx) =>
          idx === existingIndex
            ? { ...r, reactedByMe: nextReacted, count: nextCount }
            : r
        );
      }
    } else {
      updated = [...previous, { emoji, count: 1, reactedByMe: true }];
    }

    setOptimisticReactions(updated);

    try {
      await onToggleReaction(emoji);
    } catch {
      // rollback
      setOptimisticReactions(previous);
    }
  };

  const handleSelectFromPicker = (emoji: string) => {
    handleToggle(emoji);
    close();
    setShowAllPickerEmojis(false);
    triggerRef.current?.focus();
  };

  const handlePopoverKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % currentPickerEmojis.length;
      setFocusedIndex(nextIndex);
      buttonRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex =
        (focusedIndex - 1 + currentPickerEmojis.length) % currentPickerEmojis.length;
      setFocusedIndex(prevIndex);
      buttonRefs.current[prevIndex]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      setShowAllPickerEmojis(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      close();
      setShowAllPickerEmojis(false);
    }
  };

  const pillClasses =
    size === 'md'
      ? 'h-8 min-h-8 px-3 py-1.5 text-[13px] font-medium leading-none gap-1'
      : 'h-7 min-h-7 px-2.5 py-0.5 text-xs font-medium leading-none gap-1';

  const triggerClasses =
    size === 'md'
      ? 'h-8 min-h-8 px-2.5 py-1 text-[13px] font-medium leading-none gap-0.5'
      : 'h-7 min-h-7 px-2 py-0.5 text-xs font-medium leading-none gap-0.5';

  const popoverButtonClasses = isCoarsePointer
    ? 'w-12 h-12 text-[28px]'
    : 'w-9 h-9 text-[24px]';

  const popoverActionClasses = isCoarsePointer
    ? 'w-12 h-12'
    : 'w-9 h-9';

  const popoverActionIconSize = isCoarsePointer ? 20 : 18;

  const userReactions = optimisticReactions
    .filter((r) => r.reactedByMe)
    .map((r) => r.emoji);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center flex-wrap gap-[3px]"
    >
      <style>{`
        @keyframes popoverScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reaction-popover-anim {
            animation: none !important;
          }
        }
        .reaction-popover-anim {
          animation: popoverScaleIn 120ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {optimisticReactions.map((item) => (
        <button
          key={item.emoji}
          type="button"
          onClick={() => handleToggle(item.emoji)}
          aria-pressed={item.reactedByMe}
          aria-label={`รีแอคชัน ${getEmojiLabel(item.emoji)} ${item.count} คน`}
          title={
            item.reactedByMe
              ? 'คุณกดรีแอคชันนี้แล้ว (คลิกเพื่อยกเลิก)'
              : 'คลิกเพื่อกดรีแอคชัน'
          }
          className={`inline-flex items-center justify-center rounded-full border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 relative after:absolute after:inset-[-6px] after:content-[''] ${pillClasses} ${
            item.reactedByMe
              ? 'border-[#18181b] bg-[#f4f4f5] text-[#18181b] font-medium'
              : 'border-[#e4e4e7] bg-white text-[#18181b] hover:bg-[#f4f4f5]'
          }`}
        >
          <span
            className="inline-flex items-center justify-center leading-none select-none shrink-0"
            style={{ fontSize: `${currentSize.emoji}px` }}
          >
            {item.emoji}
          </span>
          <span className="text-[#a1a1aa] font-normal select-none leading-none">·</span>
          <span className="tabular-nums font-medium leading-none">{item.count}</span>
        </button>
      ))}

      <div className="inline-flex">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (isOpen) {
              close();
              setShowAllPickerEmojis(false);
            } else {
              open();
            }
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="เพิ่มรีแอคชัน"
          className={`inline-flex items-center justify-center rounded-full border transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 relative after:absolute after:inset-[-6px] after:content-[''] ${triggerClasses} ${
            isOpen
              ? 'border-[#18181b] bg-[#f4f4f5] text-[#18181b]'
              : 'border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] active:scale-[0.98]'
          }`}
        >
          <svg
            width={currentSize.addIcon}
            height={currentSize.addIcon}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle cx="5.8" cy="6.6" r="0.9" fill="currentColor" />
            <circle cx="10.2" cy="6.6" r="0.9" fill="currentColor" />
            <path
              d="M5.3 9.6C5.9 10.6 6.85 11.1 8 11.1C9.15 11.1 10.1 10.6 10.7 9.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={`font-sans font-medium leading-none text-[#71717a] select-none ${
              size === 'md' ? 'text-[13px]' : 'text-[11px]'
            }`}
          >
            +
          </span>
        </button>

        {/* Floating Popover via Portal for both Mobile and Desktop */}
        {isMounted && isOpen && position &&
          createPortal(
            <div
              ref={popoverRef}
              role="menu"
              aria-label="เลือกอีโมจิรีแอคชัน"
              onKeyDown={handlePopoverKeyDown}
              className="reaction-popover-anim fixed z-50 flex items-center flex-nowrap w-max gap-1.5 sm:gap-2 rounded-xl border border-[#e4e4e7] bg-white px-2.5 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] max-w-[calc(100vw-24px)] overflow-x-auto whitespace-nowrap"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transformOrigin: position.transformOrigin,
              }}
            >
              {INITIAL_PICKER_EMOJIS.map((emoji, index) => {
                const isSelected = userReactions.includes(emoji);
                return (
                  <button
                    key={emoji}
                    ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    aria-label={getEmojiLabel(emoji)}
                    tabIndex={focusedIndex === index ? 0 : -1}
                    onClick={() => handleSelectFromPicker(emoji)}
                    className={`flex items-center justify-center rounded-full transition-transform hover:scale-115 active:scale-95 cursor-pointer select-none leading-none shrink-0 focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ${popoverButtonClasses} ${
                      isCoarsePointer
                        ? "relative after:absolute after:inset-[-4px] after:content-['']"
                        : ''
                    } ${
                      isSelected
                        ? 'bg-[#f4f4f5] ring-1 ring-[#18181b]'
                        : 'hover:bg-[#f4f4f5]'
                    }`}
                  >
                    <span className="leading-none select-none">
                      {emoji}
                    </span>
                  </button>
                );
              })}

              {!showAllPickerEmojis ? (
                <button
                  type="button"
                  onClick={() => setShowAllPickerEmojis(true)}
                  aria-label="ดูอิโมจิเพิ่มเติม"
                  title="ดูอิโมจิเพิ่มเติม"
                  className={`flex items-center justify-center rounded-full border border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] active:scale-95 transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 shrink-0 ml-0.5 ${popoverActionClasses}`}
                >
                  <svg
                    width={popoverActionIconSize}
                    height={popoverActionIconSize}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 3.5V12.5M3.5 8H12.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <>
                  {REMAINING_PICKER_EMOJIS.map((emoji, relIndex) => {
                    const index = INITIAL_PICKER_EMOJIS.length + relIndex;
                    const isSelected = userReactions.includes(emoji);
                    return (
                      <button
                        key={emoji}
                        ref={(el) => {
                          buttonRefs.current[index] = el;
                        }}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        aria-label={getEmojiLabel(emoji)}
                        tabIndex={focusedIndex === index ? 0 : -1}
                        onClick={() => handleSelectFromPicker(emoji)}
                        className={`flex items-center justify-center rounded-full transition-transform hover:scale-115 active:scale-95 cursor-pointer select-none leading-none shrink-0 focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 ${popoverButtonClasses} ${
                          isCoarsePointer
                            ? "relative after:absolute after:inset-[-4px] after:content-['']"
                            : ''
                        } ${
                          isSelected
                            ? 'bg-[#f4f4f5] ring-1 ring-[#18181b]'
                            : 'hover:bg-[#f4f4f5]'
                        }`}
                      >
                        <span className="leading-none select-none">
                          {emoji}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowAllPickerEmojis(false)}
                    aria-label="ย่ออิโมจิ"
                    title="ย่ออิโมจิ"
                    className={`flex items-center justify-center rounded-full border border-[#e4e4e7] bg-white text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b] active:scale-95 transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#18181b] focus-visible:outline-offset-2 shrink-0 ml-0.5 ${popoverActionClasses}`}
                  >
                    <svg
                      width={popoverActionIconSize}
                      height={popoverActionIconSize}
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 8H12.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}

export default ReactionBar;
