/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { alert } from '@/os.js';
import { getClockSkewDirection } from '@/utility/check-clock-skew.js';

vi.mock('@/i.js', () => ({ $i: null }));
vi.mock('@/os.js', () => ({ alert: vi.fn(async () => {}) }));
vi.mock('@/i18n.js', () => ({ updateI18n: vi.fn(), i18n: { ts: { _clockSkewWarning: { title: '時刻のずれ', description: '端末とサーバーの時刻に差があります。' } } } }));
const start = 1_700_000_000_000;

function measure(offset: number, roundTripTime = 100) {
	return { serverTime: start + roundTripTime / 2 + offset, startWallTime: start, endWallTime: start + roundTripTime, roundTripTime };
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.resetModules();
	vi.clearAllMocks();
	sessionStorage.clear();
	vi.spyOn(Date, 'now').mockReturnValue(start);
	vi.spyOn(performance, 'now').mockReturnValue(0);
});
afterEach(() => { vi.clearAllTimers(); vi.restoreAllMocks(); vi.useRealTimers(); });

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

describe('API response clock check', () => {
	async function setup() {
		const module = await import('@/utility/check-clock-skew.js');
		module.initClockSkewCheck();
		return (offset: number, extraHeaders = {}, roundTripTime = 0) => module.observeClockSkew(
			new Headers({ Date: new Date(start + offset).toUTCString(), ...extraHeaders }),
			{ startWallTime: start, endWallTime: start + roundTripTime, roundTripTime },
		);
	}

	it.each([30_000, -30_000])('warns once after two agreeing responses for skew %i', async offset => {
		const observe = await setup();
		await observe(offset); expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
		await Promise.all([observe(offset), observe(offset), observe(offset)]);
		expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(true);
		expect(alert).not.toHaveBeenCalled();
	});
	it.each([[0, 0, 0], [30_000, 0, 0], [30_000, -30_000, 0]])('requires two matching differences (%j)', async (a, b, c) => {
		const observe = await setup();
		for (const offset of [a, b, c, 30_000, 30_000]) await observe(offset);
		expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
	});
	it.each([20_000, -20_000])('allows for second precision near the boundary (%i)', async offset => {
		const observe = await setup(); await observe(offset); await observe(offset);
		expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
	});
	it('ignores missing, invalid and cached headers and slow measurements', async () => {
		const { observeClockSkew } = await import('@/utility/check-clock-skew.js');
		const observe = await setup();
		for (const headers of [new Headers(), new Headers({ Date: 'invalid' }), new Headers({ Date: '2026-10-13' })]) {
			await observeClockSkew(headers, measure(30_000));
		}
		await observe(30_000, { Age: '10' }); await observe(30_000, {}, 2_001);
		await observe(30_000); expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
		await observe(30_000); expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(true);
	});
	it('does not observe responses before the main UI is ready', async () => {
		const { observeClockSkew } = await import('@/utility/check-clock-skew.js');
		for (let i = 0; i < 3; i++) await observeClockSkew(new Headers({ Date: new Date(start + 30_000).toUTCString() }), measure(0));
		expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
	});
});

it('observes API headers without extra requests or changing the returned body', async () => {
	const { initClockSkewCheck } = await import('@/utility/check-clock-skew.js');
	const { misskeyApi } = await import('@/utility/misskey-api.js');
	const fetch = vi.spyOn(window, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ pong: 123 }), {
		status: 200, headers: { Date: new Date(start + 30_000).toUTCString() },
	}));
	await expect(misskeyApi('ping', {}, null)).resolves.toEqual({ pong: 123 });
	await expect(misskeyApi('ping', {}, null)).resolves.toEqual({ pong: 123 });
	expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
	initClockSkewCheck();
	expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(true);
	expect(fetch).toHaveBeenCalledTimes(2);
});

describe('startup fallback requests', () => {
	it('measures a cached anonymous startup using Date headers without credentials', async () => {
		const fetch = vi.spyOn(window, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ pong: 0 }), {
			status: 200, headers: { Date: new Date(start + 30_000).toUTCString() },
		}));
		const { initClockSkewCheck } = await import('@/utility/check-clock-skew.js');
		initClockSkewCheck(); initClockSkewCheck();
		await vi.advanceTimersByTimeAsync(1_000);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ping'), expect.objectContaining({ body: '{"i":null}', signal: expect.any(AbortSignal) }));
		expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
	});
	it('sends no extra requests when normal traffic completes the check', async () => {
		const { initClockSkewCheck, observeClockSkew } = await import('@/utility/check-clock-skew.js');
		const fetch = vi.spyOn(window, 'fetch');
		for (let i = 0; i < 3; i++) await observeClockSkew(new Headers({ Date: new Date(start).toUTCString() }), measure(0));
		initClockSkewCheck(); await vi.advanceTimersByTimeAsync(1_000);
		expect(fetch).not.toHaveBeenCalled(); expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
	});
	it('bounds failed requests and aborts each after three seconds', async () => {
		const fetch = vi.spyOn(window, 'fetch').mockImplementation((_input, options) => new Promise((_resolve, reject) => {
			options!.signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
		}));
		const { initClockSkewCheck } = await import('@/utility/check-clock-skew.js');
		initClockSkewCheck(); await vi.advanceTimersByTimeAsync(10_000);
		expect(fetch).toHaveBeenCalledTimes(3); expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});
	it('silently finishes when Date is missing or the network fails', async () => {
		const fetch = vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('offline')).mockImplementation(async () => new Response('{"pong":0}'));
		const { initClockSkewCheck } = await import('@/utility/check-clock-skew.js');
		initClockSkewCheck(); await vi.advanceTimersByTimeAsync(1_000);
		expect(fetch).toHaveBeenCalledTimes(3); expect((await import('@/utility/check-clock-skew.js')).clockSkewWarningVisible.value).toBe(false);
		expect(alert).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe('banner dismissal', () => {
	it('hides the warning and preserves dismissal across reloads without fallback requests', async () => {
		const module = await import('@/utility/check-clock-skew.js');
		module.clockSkewWarningVisible.value = true;
		module.dismissClockSkewWarning();
		expect(module.clockSkewWarningVisible.value).toBe(false);
		vi.resetModules();
		const reloaded = await import('@/utility/check-clock-skew.js');
		const fetch = vi.spyOn(window, 'fetch');
		reloaded.initClockSkewCheck();
		for (let i = 0; i < 3; i++) await reloaded.observeClockSkew(new Headers({ Date: new Date(start + 30_000).toUTCString() }), measure(0));
		await vi.advanceTimersByTimeAsync(10_000);
		expect(reloaded.clockSkewWarningVisible.value).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});
	it.each(['0', 'true', 'invalid'])('ignores invalid stored dismissal %s', async value => {
		sessionStorage.setItem('clockSkewWarningDismissed', value);
		const module = await import('@/utility/check-clock-skew.js'); module.initClockSkewCheck();
		for (let i = 0; i < 2; i++) await module.observeClockSkew(new Headers({ Date: new Date(start + 30_000).toUTCString() }), measure(0));
		expect(module.clockSkewWarningVisible.value).toBe(true);
	});
	it('keeps dismissal effective when session storage cannot be written', async () => {
		const module = await import('@/utility/check-clock-skew.js'); module.initClockSkewCheck();
		module.clockSkewWarningVisible.value = true;
		vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
		expect(() => module.dismissClockSkewWarning()).not.toThrow();
		await module.observeClockSkew(new Headers({ Date: new Date(start + 30_000).toUTCString() }), measure(0));
		expect(module.clockSkewWarningVisible.value).toBe(false);
	});
	it('checks the clock when session storage cannot be read', async () => {
		vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
		const module = await import('@/utility/check-clock-skew.js'); module.initClockSkewCheck();
		for (let i = 0; i < 2; i++) await module.observeClockSkew(new Headers({ Date: new Date(start + 30_000).toUTCString() }), measure(0));
		expect(module.clockSkewWarningVisible.value).toBe(true);
	});
});
