/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { misskeyApi } from '@/utility/misskey-api.js';
import { alert } from '@/os.js';
import { getClockSkewDirection } from '@/utility/check-clock-skew.js';

vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@/os.js', () => ({ alert: vi.fn(async () => {}) }));
vi.mock('@/i18n.js', () => ({ updateI18n: vi.fn(), i18n: { ts: { _clockSkewWarning: { title: '時刻のずれ', description: '端末とサーバーの時刻に差があります。' } } } }));
const start = 1_700_000_000_000;

function measure(offset: number, roundTripTime = 100) {
	return { serverTime: start + roundTripTime / 2 + offset, startWallTime: start, endWallTime: start + roundTripTime, roundTripTime };
}

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	vi.spyOn(Date, 'now').mockReturnValue(start);
	vi.spyOn(performance, 'now').mockReturnValue(0);
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('clock skew measurements', () => {
	it.each([0, 19_999, -19_999])('does not warn for offset %i', offset => {
		expect(getClockSkewDirection(measure(offset))).toBe(0);
	});
	it.each([1, -1])('accounts for latency at the boundary in direction %i', direction => {
		for (const offset of [20_000, 20_049]) expect(getClockSkewDirection(measure(direction * offset))).toBe(0);
		for (const offset of [20_050, 30_000]) expect(getClockSkewDirection(measure(direction * offset))).toBe(direction);
	});
	it('discards slow, negative and invalid round trips', () => {
		expect(getClockSkewDirection(measure(30_000, 2_000))).toBe(1);
		for (const elapsed of [2_001, -1, NaN, Infinity]) expect(getClockSkewDirection(measure(30_000, elapsed))).toBeNull();
	});
	it.each([1_000, -1_000])('discards a wall-clock jump of %i ms', jump => {
		const sample = measure(30_000); sample.endWallTime += jump;
		expect(getClockSkewDirection(sample)).toBeNull();
	});
	it('accepts changes smaller than one second', () => {
		const sample = measure(30_000); sample.endWallTime += 999;
		expect(getClockSkewDirection(sample)).toBe(1);
	});
	it.each([undefined, null, '1700000000000', NaN, Infinity, -1, 1.5, 9e15])('discards invalid server time %s', serverTime => {
		expect(getClockSkewDirection({ ...measure(30_000), serverTime })).toBeNull();
	});
	it('discards invalid local clock readings', () => {
		for (const key of ['startWallTime', 'endWallTime', 'roundTripTime'] as const) expect(getClockSkewDirection({ ...measure(30_000), [key]: NaN })).toBeNull();
	});
});

describe('startup clock check', () => {
	it.each([30_000, -30_000])('warns only once for skew %i without credentials', async offset => {
		vi.mocked(misskeyApi).mockResolvedValue({ pong: start + offset });
		const { checkClockSkew } = await import('@/utility/check-clock-skew.js');
		await Promise.all([checkClockSkew(), checkClockSkew()]); await checkClockSkew();
		expect(misskeyApi).toHaveBeenCalledTimes(3);
		expect(misskeyApi).toHaveBeenCalledWith('ping', {}, null, expect.any(AbortSignal));
		expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'warning', title: '時刻のずれ' }));
	});
	it.each([[start, start, start], [start + 30_000, start, start], [start + 30_000, start - 30_000, start]])('requires two matching significant differences (%j)', async (a, b, c) => {
		for (const pong of [a, b, c]) vi.mocked(misskeyApi).mockResolvedValueOnce({ pong });
		const { checkClockSkew } = await import('@/utility/check-clock-skew.js'); await checkClockSkew();
		expect(alert).not.toHaveBeenCalled();
	});
	it('warns if two samples agree and one request fails', async () => {
		vi.mocked(misskeyApi).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ pong: start + 30_000 }).mockResolvedValueOnce({ pong: start + 30_000 });
		const { checkClockSkew } = await import('@/utility/check-clock-skew.js'); await checkClockSkew();
		expect(alert).toHaveBeenCalledOnce();
	});
	it('silently discards malformed responses and network failures', async () => {
		vi.mocked(misskeyApi).mockResolvedValueOnce(null).mockResolvedValueOnce({ pong: 'invalid' }).mockRejectedValueOnce(new Error('offline'));
		const { checkClockSkew } = await import('@/utility/check-clock-skew.js'); await expect(checkClockSkew()).resolves.toBeUndefined();
		expect(alert).not.toHaveBeenCalled();
	});
	it('aborts each request after three seconds and clears timers', async () => {
		vi.useFakeTimers();
		vi.mocked(misskeyApi).mockImplementation((_endpoint, _data, _token, signal) => new Promise((_resolve, reject) => {
			signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
		}));
		const { checkClockSkew } = await import('@/utility/check-clock-skew.js'); const checking = checkClockSkew();
		await vi.advanceTimersByTimeAsync(8_999);
		expect(misskeyApi).toHaveBeenCalledTimes(3); expect(vi.mocked(misskeyApi).mock.calls[2][3]?.aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(1); await expect(checking).resolves.toBeUndefined();
		expect(vi.mocked(misskeyApi).mock.calls.every(call => call[3]?.aborted)).toBe(true);
		expect(vi.getTimerCount()).toBe(0); expect(alert).not.toHaveBeenCalled();
	});
	it('clears successful request timers and handles dialog failures', async () => {
		vi.useFakeTimers(); vi.mocked(misskeyApi).mockResolvedValue({ pong: start + 30_000 });
		vi.mocked(alert).mockRejectedValueOnce(new Error('dialog failed'));
		const { checkClockSkew } = await import('@/utility/check-clock-skew.js'); await expect(checkClockSkew()).resolves.toBeUndefined();
		expect(vi.getTimerCount()).toBe(0);
	});
});
