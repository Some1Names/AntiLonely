import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addDuration,
  dateInputToEnd,
  formatThaiDate,
  isBanConfirmed,
  isSanctionActive,
  maskEmail,
  MAX_SUSPENSION_DAYS,
  suspensionEndsWithinLimit,
} from './sanctions.ts';

const start = new Date('2026-11-07T10:00:00+07:00');

test('addDuration adds days, weeks and months', () => {
  assert.equal(addDuration(start, 7, 'day').toISOString(), new Date('2026-11-14T10:00:00+07:00').toISOString());
  assert.equal(addDuration(start, 2, 'week').toISOString(), new Date('2026-11-21T10:00:00+07:00').toISOString());
  assert.equal(addDuration(start, 3, 'month').toISOString(), new Date('2027-02-07T10:00:00+07:00').toISOString());
});

test('addDuration does not change the start date', () => {
  const copy = new Date(start);
  addDuration(start, 45, 'day');
  assert.equal(start.getTime(), copy.getTime());
});

test('formatThaiDate uses the Buddhist year and Thai short month', () => {
  assert.equal(formatThaiDate(new Date('2026-12-22T10:00:00+07:00')), '22 ธ.ค. 2569');
});

test('formatThaiDate uses Bangkok time, not the server time zone', () => {
  // 20:00 UTC on 21 Dec is already 22 Dec in Bangkok.
  assert.equal(formatThaiDate(new Date('2026-12-21T20:00:00Z')), '22 ธ.ค. 2569');
});

test('dateInputToEnd reads a date input value as midnight Bangkok time', () => {
  assert.equal(dateInputToEnd('2026-12-22')?.toISOString(), '2026-12-21T17:00:00.000Z');
  assert.equal(dateInputToEnd(''), null);
  assert.equal(dateInputToEnd('not-a-date'), null);
});

test('suspensionEndsWithinLimit rejects past dates and dates beyond the limit', () => {
  assert.equal(suspensionEndsWithinLimit(addDuration(start, 1, 'day'), start), true);
  assert.equal(suspensionEndsWithinLimit(addDuration(start, MAX_SUSPENSION_DAYS, 'day'), start), true);
  assert.equal(suspensionEndsWithinLimit(addDuration(start, MAX_SUSPENSION_DAYS + 1, 'day'), start), false);
  assert.equal(suspensionEndsWithinLimit(new Date(start.getTime() - 1), start), false);
});

test('maskEmail keeps the first two letters and the domain', () => {
  assert.equal(maskEmail('claire@outlook.com'), 'cl***@outlook.com');
  assert.equal(maskEmail('d@gmail.com'), 'd***@gmail.com');
  assert.equal(maskEmail('no-at-sign'), '***');
});

test('isBanConfirmed needs the word BAN, ignoring case and spaces', () => {
  assert.equal(isBanConfirmed('BAN'), true);
  assert.equal(isBanConfirmed('  ban '), true);
  assert.equal(isBanConfirmed('BANN'), false);
  assert.equal(isBanConfirmed(''), false);
});

test('isSanctionActive', () => {
  const now = start;
  const day = 24 * 60 * 60 * 1000;
  const past = new Date(now.getTime() - day);
  const future = new Date(now.getTime() + day);
  assert.equal(isSanctionActive({ startAt: past, endAt: future, liftedAt: null }, now), true);
  assert.equal(isSanctionActive({ startAt: past, endAt: null, liftedAt: null }, now), true, 'no end = permanent');
  assert.equal(isSanctionActive({ startAt: past, endAt: past, liftedAt: null }, now), false, 'already ended');
  assert.equal(isSanctionActive({ startAt: past, endAt: future, liftedAt: past }, now), false, 'lifted');
  assert.equal(isSanctionActive({ startAt: future, endAt: null, liftedAt: null }, now), false, 'not started');
});
