import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reactionPickerStore } from './reaction-picker-store.ts';

describe('reactionPickerStore', () => {
  it('enforces single open picker and notifies listeners', () => {
    let notified = 0;
    const unsub = reactionPickerStore.subscribe(() => {
      notified++;
    });

    reactionPickerStore.open('picker-1');
    assert.equal(reactionPickerStore.getSnapshot(), 'picker-1');
    assert.equal(notified, 1);

    // Opening picker-2 displaces picker-1
    reactionPickerStore.open('picker-2');
    assert.equal(reactionPickerStore.getSnapshot(), 'picker-2');
    assert.equal(notified, 2);

    // Closing a different id does not close current active picker
    reactionPickerStore.close('picker-1');
    assert.equal(reactionPickerStore.getSnapshot(), 'picker-2');
    assert.equal(notified, 2);

    // Closing active picker sets snapshot to null
    reactionPickerStore.close('picker-2');
    assert.equal(reactionPickerStore.getSnapshot(), null);
    assert.equal(notified, 3);

    // Closing without id closes whatever is open
    reactionPickerStore.open('picker-3');
    assert.equal(reactionPickerStore.getSnapshot(), 'picker-3');
    reactionPickerStore.close();
    assert.equal(reactionPickerStore.getSnapshot(), null);

    unsub();
  });
});

