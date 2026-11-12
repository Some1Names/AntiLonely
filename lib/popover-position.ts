export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PopoverResult {
  placement: 'bottom' | 'top';
  top: number;
  left: number;
  transformOrigin: string;
  shouldFallbackToSheet: boolean;
}

export interface PopoverOptions {
  gap?: number;
  viewportPadding?: number;
  avoidRect?: Rect;
}

export function computePopoverPosition(
  triggerRect: Rect,
  popoverSize: { width: number; height: number },
  viewportSize: { width: number; height: number },
  options?: PopoverOptions
): PopoverResult {
  const gap = options?.gap ?? 8;
  const pad = options?.viewportPadding ?? 12;

  // Clamped horizontal position
  const desiredLeft = triggerRect.left;
  const maxLeft = Math.max(pad, viewportSize.width - popoverSize.width - pad);
  const left = Math.max(pad, Math.min(desiredLeft, maxLeft));

  // 1. Check bottom placement
  const bottomY = triggerRect.bottom + gap;
  const bottomFits = bottomY + popoverSize.height <= viewportSize.height - pad;

  let placement: 'bottom' | 'top' = 'bottom';
  let top = bottomY;
  let shouldFallbackToSheet = false;

  if (bottomFits) {
    placement = 'bottom';
    top = bottomY;
  } else {
    // 2. Candidate upward flip
    const topY = triggerRect.top - gap - popoverSize.height;
    const topFitsViewport = topY >= pad;

    let collidesAvoidRect = false;
    if (options?.avoidRect) {
      const candidateRect: Rect = {
        top: topY,
        bottom: topY + popoverSize.height,
        left,
        right: left + popoverSize.width,
      };

      const intersectsAvoid =
        candidateRect.top < options.avoidRect.bottom &&
        candidateRect.bottom > options.avoidRect.top &&
        candidateRect.left < options.avoidRect.right &&
        candidateRect.right > options.avoidRect.left;

      if (intersectsAvoid) {
        collidesAvoidRect = true;
      }
    }

    if (topFitsViewport && !collidesAvoidRect) {
      placement = 'top';
      top = topY;
    } else {
      shouldFallbackToSheet = true;
      const spaceBelow = viewportSize.height - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      if (spaceAbove > spaceBelow && !collidesAvoidRect) {
        placement = 'top';
        top = Math.max(pad, topY);
      } else {
        placement = 'bottom';
        top = Math.max(
          pad,
          Math.min(bottomY, viewportSize.height - popoverSize.height - pad)
        );
      }
    }
  }

  // Transform origin based on placement and relative horizontal offset
  const originX = triggerRect.left > left + 60 ? 'center' : 'left';
  const transformOrigin =
    placement === 'bottom' ? `top ${originX}` : `bottom ${originX}`;

  return {
    placement,
    top,
    left,
    transformOrigin,
    shouldFallbackToSheet,
  };
}
