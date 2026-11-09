import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computePopoverPosition } from './popover-position.ts';

describe('computePopoverPosition', () => {
  const popover = { width: 280, height: 50 };
  const viewport = { width: 1024, height: 768 };

  it('defaults to bottom with 8px gap when space is available', () => {
    const trigger = { top: 200, bottom: 236, left: 100, right: 136 };
    const res = computePopoverPosition(trigger, popover, viewport, { gap: 8 });
    assert.equal(res.placement, 'bottom');
    assert.equal(res.top, 244); // 236 + 8
    assert.equal(res.shouldFallbackToSheet, false);
    assert.equal(res.transformOrigin, 'top left');
  });

  it('flips to top when bottom space is inadequate and top is clear', () => {
    const trigger = { top: 730, bottom: 760, left: 100, right: 136 };
    const res = computePopoverPosition(trigger, popover, viewport, { gap: 8 });
    assert.equal(res.placement, 'top');
    assert.equal(res.top, 672); // 730 - 50 - 8
    assert.equal(res.shouldFallbackToSheet, false);
    assert.equal(res.transformOrigin, 'bottom left');
  });

  it('detects avoidRect collision on upward flip and triggers fallback to sheet', () => {
    // In a short post card, the header is at y=685..715, trigger is at y=730..760
    // Candidate top would be 672..722, colliding with avoidRect (header)
    const trigger = { top: 730, bottom: 760, left: 100, right: 136 };
    const postHeader = { top: 685, bottom: 715, left: 100, right: 400 };

    const res = computePopoverPosition(trigger, popover, viewport, {
      gap: 8,
      avoidRect: postHeader,
    });

    assert.equal(res.shouldFallbackToSheet, true);
  });

  it('shifts left to clamp within 12px viewport padding on right-edge triggers', () => {
    const trigger = { top: 200, bottom: 236, left: 950, right: 986 };
    const res = computePopoverPosition(trigger, popover, viewport, {
      gap: 8,
      viewportPadding: 12,
    });
    assert.ok(res.left + popover.width <= 1024 - 12);
    assert.ok(res.left >= 12);
    assert.equal(res.transformOrigin, 'top center');
  });

  it('clamps left to minimum viewport padding on left-edge triggers', () => {
    const trigger = { top: 200, bottom: 236, left: 4, right: 40 };
    const res = computePopoverPosition(trigger, popover, viewport, {
      gap: 8,
      viewportPadding: 12,
    });
    assert.equal(res.left, 12);
  });

  it('triggers fallback to sheet when neither bottom nor top fits within viewport padding', () => {
    // Viewport height is small, trigger is centered, neither top nor bottom has 50px + 8px
    const smallViewport = { width: 1024, height: 100 };
    const trigger = { top: 40, bottom: 60, left: 100, right: 136 };
    const res = computePopoverPosition(trigger, popover, smallViewport, {
      gap: 8,
      viewportPadding: 12,
    });
    assert.equal(res.shouldFallbackToSheet, true);
  });

  it('handles multiple standard screen sizes (360px, 390px, 768px, 1440px)', () => {
    for (const width of [360, 390, 768, 1440]) {
      const vp = { width, height: 800 };
      const trigger = { top: 300, bottom: 336, left: width - 50, right: width - 14 };
      const res = computePopoverPosition(trigger, popover, vp, { gap: 8, viewportPadding: 12 });
      assert.ok(res.left >= 12, `left bound check for width ${width}`);
      assert.ok(
        res.left + popover.width <= Math.max(width - 12, popover.width + 12),
        `right bound check for width ${width}`
      );
    }
  });
});
