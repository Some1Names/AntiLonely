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
  toggleReaction,
  type ReactionSize,
} from '@/lib/post-thread';
import {
  getEmojiItem,
  getEmojiLabel,
} from '@/lib/emoji-catalog';
import { computePopoverPosition, type PopoverResult } from '@/lib/popover-position';
import { useIsMobile } from '@/component/useIsMobile';
import { useActiveReactionPicker } from '@/lib/reaction-picker-store';
import { stickerToggleClass } from '@/lib/styles';

export { REACTION_SIZES, type ReactionSize };

const emptySubscribe = () => () => {};

// The shared sticker toggle without its own text size: pillClasses and
// triggerClasses set the size per variant.
const chipClass = stickerToggleClass.replace(' text-sm', '');

// Focus ring for the picker's cells: the global outline is kept, the cell
// itself turns highlighter yellow.
const pickerCellFocusClass = 'focus-visible:bg-highlight';

export interface ReactionBarProps {
  reactions: ReactionItem[];
  onToggleReaction: (emoji: string) => Promise<boolean | void> | boolean | void;
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
  const { isMobile, isCoarsePointer } = useIsMobile();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [showAllPickerEmojis, setShowAllPickerEmojis] = useState(false);
  const [position, setPosition] = useState<PopoverResult | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Drag down gesture state for mobile bottom sheet
  const [dragTranslateY, setDragTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const pendingEmojisRef = useRef<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sheetButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Optimistic reactions state synced with props during render
  const [prevReactions, setPrevReactions] = useState<ReactionItem[]>(reactions);
  const [optimisticReactions, setOptimisticReactions] = useState<ReactionItem[]>(reactions);

  if (prevReactions !== reactions) {
    setPrevReactions(reactions);
    setOptimisticReactions(reactions);
  }

  // Preserved original emoji list and order (INITIAL 4 + REMAINING 5)
  const currentPickerEmojis = useMemo(
    () =>
      showAllPickerEmojis
        ? [...INITIAL_PICKER_EMOJIS, ...REMAINING_PICKER_EMOJIS]
        : [...INITIAL_PICKER_EMOJIS],
    [showAllPickerEmojis]
  );

  const handleClose = useCallback(() => {
    setDragTranslateY(0);
    setIsDragging(false);
    setShowAllPickerEmojis(false);
    close();
    triggerRef.current?.focus();
  }, [close]);

  // Close picker if viewport crosses the 768px breakpoint while open
  const prevIsMobileRef = useRef(isMobile);
  useEffect(() => {
    if (prevIsMobileRef.current !== isMobile) {
      prevIsMobileRef.current = isMobile;
      if (isOpen) {
        close();
      }
    }
  }, [isMobile, isOpen, close]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined' || isMobile) return;

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
  }, [avoidRef, isMobile, showAllPickerEmojis, isCoarsePointer]);

  // Measure and compute layout on open (desktop only)
  useLayoutEffect(() => {
    if (isOpen && !isMobile) {
      updatePosition();
      // Focus initial item
      const firstSelectedIndex = currentPickerEmojis.findIndex((char) =>
        optimisticReactions.some((r) => r.emoji === char && r.reactedByMe)
      );
      const initialIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0;
      buttonRefs.current[initialIndex]?.focus();
    }
  }, [isOpen, isMobile, updatePosition, optimisticReactions, currentPickerEmojis]);

  // Re-measure when expanding/collapsing emojis on desktop
  useEffect(() => {
    if (isOpen && !isMobile) {
      updatePosition();
    }
  }, [showAllPickerEmojis, isOpen, isMobile, updatePosition]);

  // Focus initial item for mobile bottom sheet
  useEffect(() => {
    if (isOpen && isMobile) {
      const firstSelectedIndex = currentPickerEmojis.findIndex((char) =>
        optimisticReactions.some((r) => r.emoji === char && r.reactedByMe)
      );
      const initialIndex = firstSelectedIndex >= 0 ? firstSelectedIndex : 0;
      const timer = setTimeout(() => {
        sheetButtonRefs.current[initialIndex]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile, currentPickerEmojis, optimisticReactions]);

  // Scroll lock & auto-scroll for mobile bottom sheet: ensures target post is visible above sheet
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalScrollY = window.scrollY;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const originalOverflow = document.body.style.overflow;
      const originalPaddingBottom = document.body.style.paddingBottom;

      // Estimate bottom sheet height (header + handle + 3 rows of buttons + safe area padding)
      const estimatedSheetHeight = 340;
      const safeBottom = window.innerHeight - estimatedSheetHeight - 16;

      // Find the card or container of the post/comment being reacted to
      const targetEl =
        triggerRef.current?.closest('article') ||
        triggerRef.current?.closest('[data-comment-item]') ||
        triggerRef.current?.parentElement ||
        triggerRef.current;

      let targetScrollY = originalScrollY;

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        // If the bottom of the card is below the safe area (i.e. covered by sheet)
        if (rect.bottom > safeBottom) {
          const deltaY = rect.bottom - safeBottom;
          // Ensure we don't scroll the top of the card off the top of the screen (under header)
          const maxDeltaY = Math.max(0, rect.top - 68);
          const scrollAdjustment = Math.min(deltaY, maxDeltaY);

          if (scrollAdjustment > 0) {
            targetScrollY = originalScrollY + scrollAdjustment;

            // Ensure document has enough scrollable room
            const maxScroll = Math.max(
              0,
              document.documentElement.scrollHeight - window.innerHeight
            );
            if (targetScrollY > maxScroll) {
              const neededPadding = targetScrollY - maxScroll + 48;
              document.body.style.paddingBottom = `${neededPadding}px`;
            }

            window.scrollTo({ top: targetScrollY, behavior: 'instant' });
          }
        }
      }

      document.body.style.position = 'fixed';
      document.body.style.top = `-${targetScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingBottom = originalPaddingBottom;
        window.scrollTo(0, targetScrollY);
      };
    }
  }, [isOpen, isMobile]);

  // Desktop click/tap outside and scroll dismiss
  useEffect(() => {
    if (!isOpen || isMobile) return;

    function handlePointerDown(event: PointerEvent | MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      handleClose();
    }

    function handleScroll() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        handleClose();
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
  }, [isOpen, isMobile, handleClose, updatePosition]);

  const handleToggle = async (emoji: string) => {
    const key = emoji.trim();
    if (!key || pendingEmojisRef.current.has(key)) return;

    pendingEmojisRef.current.add(key);
    setOptimisticReactions((curr) => toggleReaction(curr, key));

    try {
      const accepted = await onToggleReaction(key);
      if (accepted === false) {
        setOptimisticReactions((curr) => toggleReaction(curr, key));
      }
    } catch {
      // rollback
      setOptimisticReactions((curr) => toggleReaction(curr, key));
    } finally {
      pendingEmojisRef.current.delete(key);
    }
  };

  const handleSelectFromPicker = (emoji: string) => {
    handleToggle(emoji);
    handleClose();
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
      handleClose();
    } else if (e.key === 'Tab') {
      handleClose();
    }
  };

  // Drag down gesture handlers for mobile bottom sheet
  const handleDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartYRef.current;
    setDragTranslateY(Math.max(0, deltaY));
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
    const deltaY = e.clientY - dragStartYRef.current;
    const elapsed = Math.max(1, Date.now() - dragStartTimeRef.current);
    const velocity = deltaY / elapsed;

    if (deltaY > 80 || (velocity > 0.5 && deltaY > 20)) {
      handleClose();
    } else {
      setDragTranslateY(0);
    }
  };

  // Focus trap and keyboard dismiss for bottom sheet
  const handleSheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
    ? 'w-11 h-11 text-[26px]'
    : 'w-9 h-9 text-[22px]';

  const popoverActionClasses = isCoarsePointer
    ? 'w-11 h-11'
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
        @keyframes bottomSheetSlideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes backdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reaction-popover-anim,
          .reaction-sheet-anim,
          .reaction-backdrop-anim {
            animation: none !important;
          }
        }
        .reaction-popover-anim {
          animation: popoverScaleIn 120ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .reaction-sheet-anim {
          animation: bottomSheetSlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reaction-backdrop-anim {
          animation: backdropFadeIn 200ms ease-out forwards;
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

            className={`inline-flex items-center justify-center inline-flex items-center justify-center cursor-pointer select-none text-ink relative after:absolute after:inset-y-[-6px] after:inset-x-0 after:content-[''] ${chipClass} ${pillClasses}`}
        >
          <span
            className="inline-flex items-center justify-center leading-none select-none shrink-0"
            style={{ fontSize: `${currentSize.emoji}px` }}
          >
            {item.emoji}
          </span>
          <span className="text-ink-soft font-normal select-none leading-none">·</span>
          <span className="tabular-nums font-medium leading-none">{item.count}</span>
        </button>
      ))}

      <div className="inline-flex">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (isOpen) {
              handleClose();
            } else {
              open();
            }
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="เพิ่มรีแอคชัน"
          className={`inline-flex items-center justify-center inline-flex items-center justify-center cursor-pointer select-none relative after:absolute after:inset-y-[-6px] after:inset-x-0 after:content-[''] ${chipClass} ${triggerClasses} ${
            isOpen
              ? 'translate-0.5 bg-kmutt-yellow text-ink shadow-none hover:bg-kmutt-yellow'
              : 'text-ink-soft hover:text-ink'
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
            className={`font-sans font-medium leading-none select-none ${
              size === 'md' ? 'text-[13px]' : 'text-[11px]'
            }`}
          >
            +
          </span>
        </button>

        {/* Mobile Bottom Sheet via Portal (<768px) */}
        {isMounted && isOpen && isMobile &&
          createPortal(
            <div className="fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-ink/40 reaction-backdrop-anim touch-none"
                onClick={handleClose}
                aria-hidden="true"
              />

              {/* Sheet Dialog */}
              <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-sheet-title`}
                onKeyDown={handleSheetKeyDown}
                className={`fixed left-0 right-0 bottom-0 z-50 max-h-[80vh] max-h-[80dvh] bg-paper rounded-t-2xl border-[1.5px] border-b-0 border-ink shadow-[0_-4px_0_var(--color-edge-strong)] px-4 pt-1 pb-4 pb-[max(16px,env(safe-area-inset-bottom,0px))] flex flex-col select-none overflow-hidden ${
                  isDragging || dragTranslateY > 0 ? '' : 'reaction-sheet-anim'
                }`}
                style={{
                  transform: dragTranslateY > 0 ? `translateY(${dragTranslateY}px)` : undefined,
                  transition: isDragging ? 'none' : 'transform 150ms ease-out',
                }}
              >
                {/* Drag Handle (reduced vertical gap to title by 8–12px, >=44px swipe down touch target) */}
                <div
                  className="w-full flex items-center justify-center pt-1.5 pb-0.5 cursor-grab active:cursor-grabbing touch-none shrink-0 relative after:absolute after:inset-y-[-10px] after:inset-x-0 after:content-['']"
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  onPointerCancel={handleDragEnd}
                  aria-hidden="true"
                >
                  <div className="w-10 h-1 bg-edge-strong rounded-full" />
                </div>

                {/* Sheet Header (Title and Close Button vertically centered, exactly 44x44 touch target) */}
                <div
                  className="flex items-center justify-between min-h-[44px] shrink-0 pl-1 touch-none"
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  onPointerCancel={handleDragEnd}
                >
                  <h2
                    id={`${id}-sheet-title`}
                    className="text-sm font-semibold text-ink leading-normal select-none"
                  >
                    เลือกความรู้สึก
                  </h2>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleClose}
                    aria-label="ปิด"
                    className="w-11 h-11 -mr-1 flex items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-butter transition-colors cursor-pointer select-none"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Options Grid (with internal scrolling if height constrained) */}
                <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 -mx-1 px-1 mt-1 pb-1">
                  <div className="grid grid-cols-3 gap-2">
                    {currentPickerEmojis.map((emoji, idx) => {
                      const isSelected = userReactions.includes(emoji);
                      const itemMeta = getEmojiItem(emoji);
                      const label = itemMeta?.labelTh ?? getEmojiLabel(emoji);
                      return (
                        <button
                          key={emoji}
                          ref={(el) => {
                            sheetButtonRefs.current[idx] = el;
                          }}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={`${label} (${emoji})`}
                          onClick={() => handleSelectFromPicker(emoji)}
                          className={`min-h-[76px] py-2 w-full flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] transition-all active:scale-[0.97] cursor-pointer select-none ${pickerCellFocusClass} ${
                            isSelected
                              ? 'bg-kmutt-yellow border-ink'
                              : 'bg-white border-edge-strong hover:bg-butter'
                          }`}
                        >
                          <span className="text-[32px] leading-none select-none shrink-0">
                            {emoji}
                          </span>
                          <span className="text-xs font-medium text-ink-soft leading-5 min-h-[20px] flex items-center justify-center text-center whitespace-nowrap max-w-full px-1">
                            {label}
                          </span>
                        </button>
                      );
                    })}

                    {!showAllPickerEmojis ? (
                      <button
                        type="button"
                        onClick={() => setShowAllPickerEmojis(true)}
                        aria-label="ดูอิโมจิเพิ่มเติม"
                        className="min-h-[76px] py-2 w-full flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-edge-strong bg-white text-ink-soft hover:bg-butter hover:text-ink hover:border-ink transition-all active:scale-[0.97] cursor-pointer select-none focus-visible:bg-highlight"
                      >
                        <svg
                          width="22"
                          height="22"
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
                        <span className="text-xs font-medium text-ink-soft leading-5 min-h-[20px] flex items-center justify-center text-center whitespace-nowrap px-1">
                          เพิ่มเติม
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAllPickerEmojis(false)}
                        aria-label="ย่ออิโมจิ"
                        className="min-h-[76px] py-2 w-full flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-edge-strong bg-white text-ink-soft hover:bg-butter hover:text-ink hover:border-ink transition-all active:scale-[0.97] cursor-pointer select-none focus-visible:bg-highlight"
                      >
                        <svg
                          width="22"
                          height="22"
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
                        <span className="text-xs font-medium text-ink-soft leading-5 min-h-[20px] flex items-center justify-center text-center whitespace-nowrap px-1">
                          ย่อกลับ
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Floating Popover via Portal for Desktop (>=768px) */}
        {isMounted && isOpen && !isMobile && position &&
          createPortal(
            <div
              ref={popoverRef}
              role="menu"
              aria-label="เลือกอีโมจิรีแอคชัน"
              onKeyDown={handlePopoverKeyDown}
              className="reaction-popover-anim fixed z-50 flex items-center flex-nowrap w-max gap-1.5 sm:gap-2 rounded-xl border-[1.5px] border-ink bg-paper px-2.5 py-1.5 shadow-sticker-lg max-w-[calc(100vw-24px)] overflow-x-auto whitespace-nowrap"
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
                    className={`flex items-center justify-center rounded-full transition-transform hover:scale-115 active:scale-95 cursor-pointer select-none leading-none shrink-0 ${pickerCellFocusClass} ${popoverButtonClasses} ${
                      isCoarsePointer
                        ? "relative after:absolute after:inset-[-4px] after:content-['']"
                        : ''
                    } ${
                      isSelected
                        ? 'bg-kmutt-yellow ring-[1.5px] ring-ink'
                        : 'hover:bg-butter'
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
                  className={`flex items-center justify-center rounded-full border-[1.5px] border-dashed border-edge-strong bg-white text-ink-soft hover:bg-butter hover:text-ink hover:border-ink focus-visible:bg-highlight active:scale-95 transition-all cursor-pointer select-none shrink-0 ml-0.5 ${popoverActionClasses}`}
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
                        className={`flex items-center justify-center rounded-full transition-transform hover:scale-115 active:scale-95 cursor-pointer select-none leading-none shrink-0 ${pickerCellFocusClass} ${popoverButtonClasses} ${
                          isCoarsePointer
                            ? "relative after:absolute after:inset-[-4px] after:content-['']"
                            : ''
                        } ${
                          isSelected
                            ? 'bg-kmutt-yellow ring-[1.5px] ring-ink'
                            : 'hover:bg-butter'
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
                    className={`flex items-center justify-center rounded-full border-[1.5px] border-dashed border-edge-strong bg-white text-ink-soft hover:bg-butter hover:text-ink hover:border-ink focus-visible:bg-highlight active:scale-95 transition-all cursor-pointer select-none shrink-0 ml-0.5 ${popoverActionClasses}`}
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
