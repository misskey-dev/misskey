/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryKVCache, MemorySingleCache } from '@/misc/cache.js';

describe.skip('misc:MemoryKVCache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('set and get returns the value within lifetime', () => {
		const cache = new MemoryKVCache<string>(1000);
		cache.set('key', 'value');
		expect(cache.get('key')).toBe('value');
		cache.dispose();
	});

	test('get returns undefined after lifetime expires', () => {
		const cache = new MemoryKVCache<string>(1000);
		cache.set('key', 'value');
		vi.advanceTimersByTime(1001);
		expect(cache.get('key')).toBeUndefined();
		cache.dispose();
	});

	test('delete removes the entry', () => {
		const cache = new MemoryKVCache<string>(1000);
		cache.set('key', 'value');
		cache.delete('key');
		expect(cache.get('key')).toBeUndefined();
		cache.dispose();
	});

	describe('gc()', () => {
		test('removes expired entries', () => {
			const cache = new MemoryKVCache<string>(1000);
			cache.set('a', '1');
			cache.set('b', '2');
			vi.advanceTimersByTime(1001);
			cache.gc();
			expect(cache.get('a')).toBeUndefined();
			expect(cache.get('b')).toBeUndefined();
			cache.dispose();
		});

		test('retains entries that have not yet expired', () => {
			const cache = new MemoryKVCache<string>(2000);
			cache.set('a', '1');
			vi.advanceTimersByTime(1001);
			cache.gc();
			expect(cache.get('a')).toBe('1');
			cache.dispose();
		});

		test('removes only expired entries when mixed with live entries', () => {
			const cache = new MemoryKVCache<string>(2000);
			cache.set('old', 'oldValue');
			vi.advanceTimersByTime(2001);
			cache.set('new', 'newValue');
			cache.gc();
			expect(cache.get('old')).toBeUndefined();
			expect(cache.get('new')).toBe('newValue');
			cache.dispose();
		});

		// Regression test for https://github.com/misskey-dev/misskey/issues/15500
		// set() previously did NOT delete-before-reinsert, so updated keys kept their
		// original insertion position. gc() would then stop early at the updated key
		// (whose timestamp looked fresh) and leave subsequent, truly-expired keys alive.
		// The key observable symptom is that gc() fails to *remove* the expired entry
		// from the Map — get() has its own expiry check so it returns undefined either
		// way, but the stale entry keeps consuming memory.
		test('correctly expires old entries after a key is updated (issue #15500)', () => {
			const lifetime = 1000;
			const cache = new MemoryKVCache<string>(lifetime);

			// Insert 'a' and 'b' at t=0
			cache.set('a', 'v1');
			cache.set('b', 'v1');

			// Advance time and update 'a' — without the fix, 'a' stays at position 0
			// in the Map, so gc() sees it as fresh first and breaks early, leaving 'b'
			// (which is also expired) still in the Map (though get() would hide it).
			vi.advanceTimersByTime(500);
			cache.set('a', 'v2'); // refresh 'a'; 'b' is still at t=0

			// 'b' is now expired, 'a' has 400ms left
			vi.advanceTimersByTime(600); // total 1100ms

			cache.gc();

			// Verify the entry is actually removed from the Map, not just hidden by get().
			// get() always checks expiry itself, so it returns undefined even without gc() —
			// the real bug is memory not being freed.
			const entries = [...cache.entries];
			expect(entries.find(([k]) => k === 'b')).toBeUndefined(); // 'b' must be gone from Map
			expect(entries.find(([k]) => k === 'a')?.[1].value).toBe('v2'); // 'a' still in Map
			cache.dispose();
		});

		test('gc does not break when cache is empty', () => {
			const cache = new MemoryKVCache<string>(1000);
			expect(() => cache.gc()).not.toThrow();
			cache.dispose();
		});
	});

	describe('fetch()', () => {
		test('calls fetcher on cache miss', async () => {
			const cache = new MemoryKVCache<string>(1000);
			const fetcher = vi.fn().mockResolvedValue('fetched');
			const result = await cache.fetch('key', fetcher);
			expect(fetcher).toHaveBeenCalledOnce();
			expect(result).toBe('fetched');
			cache.dispose();
		});

		test('does not call fetcher on cache hit', async () => {
			const cache = new MemoryKVCache<string>(1000);
			cache.set('key', 'cached');
			const fetcher = vi.fn().mockResolvedValue('fetched');
			const result = await cache.fetch('key', fetcher);
			expect(fetcher).not.toHaveBeenCalled();
			expect(result).toBe('cached');
			cache.dispose();
		});

		test('respects validator and bypasses cache when validator returns false', async () => {
			const cache = new MemoryKVCache<string>(1000);
			cache.set('key', 'cached');
			const fetcher = vi.fn().mockResolvedValue('fetched');
			const result = await cache.fetch('key', fetcher, () => false);
			expect(fetcher).toHaveBeenCalledOnce();
			expect(result).toBe('fetched');
			cache.dispose();
		});
	});

	describe('fetchMaybe()', () => {
		test('does not cache undefined returned by fetcher', async () => {
			const cache = new MemoryKVCache<string>(1000);
			const fetcher = vi.fn().mockResolvedValue(undefined);
			const result = await cache.fetchMaybe('key', fetcher);
			expect(result).toBeUndefined();
			// A second call should invoke the fetcher again because undefined was not cached
			await cache.fetchMaybe('key', fetcher);
			expect(fetcher).toHaveBeenCalledTimes(2);
			cache.dispose();
		});
	});
});

describe('misc:MemorySingleCache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('set and get returns the value within lifetime', () => {
		const cache = new MemorySingleCache<string>(1000);
		cache.set('value');
		expect(cache.get()).toBe('value');
	});

	test('get returns undefined after lifetime expires', () => {
		const cache = new MemorySingleCache<string>(1000);
		cache.set('value');
		vi.advanceTimersByTime(1001);
		expect(cache.get()).toBeUndefined();
	});

	test('delete removes the cached value', () => {
		const cache = new MemorySingleCache<string>(1000);
		cache.set('value');
		cache.delete();
		expect(cache.get()).toBeUndefined();
	});

	describe('fetch()', () => {
		test('calls fetcher on cache miss', async () => {
			const cache = new MemorySingleCache<string>(1000);
			const fetcher = vi.fn().mockResolvedValue('fetched');
			const result = await cache.fetch(fetcher);
			expect(fetcher).toHaveBeenCalledOnce();
			expect(result).toBe('fetched');
		});

		test('does not call fetcher on cache hit', async () => {
			const cache = new MemorySingleCache<string>(1000);
			cache.set('cached');
			const fetcher = vi.fn().mockResolvedValue('fetched');
			const result = await cache.fetch(fetcher);
			expect(fetcher).not.toHaveBeenCalled();
			expect(result).toBe('cached');
		});

		test('respects validator and bypasses cache when validator returns false', async () => {
			const cache = new MemorySingleCache<string>(1000);
			cache.set('cached');
			const fetcher = vi.fn().mockResolvedValue('fetched');
			const result = await cache.fetch(fetcher, () => false);
			expect(fetcher).toHaveBeenCalledOnce();
			expect(result).toBe('fetched');
		});
	});
});
