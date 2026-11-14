/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Paginator } from '@/utility/paginator.js';

const misskeyApiMock = vi.hoisted(() => vi.fn());

vi.mock('@/utility/misskey-api.js', () => {
	return { misskeyApi: misskeyApiMock };
});

type Item = { id: string; createdAt: string };

function item(id: string): Item {
	return { id, createdAt: new Date(0).toISOString() };
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('Paginator', () => {
	beforeEach(() => {
		misskeyApiMock.mockReset();
	});

	test('取得中に reload() されたら、先に始まった取得の応答は一覧に反映しない', async () => {
		const first = deferred<Item[]>();
		const second = deferred<Item[]>();
		misskeyApiMock
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);

		const paginator = new Paginator('i/favorites', {});

		const firstInit = paginator.init();
		const reload = paginator.reload();

		// 新しい取得が先に終わり、古い取得の応答が後から届く
		second.resolve([item('b')]);
		await reload;
		first.resolve([item('a'), item('b')]);
		await firstInit;

		expect(paginator.items.value.map(x => x.id)).toEqual(['b']);
		expect(paginator.fetching.value).toBe(false);
	});

	test('取得が重なっても、同じ項目が二重に並ばない', async () => {
		const first = deferred<Item[]>();
		const second = deferred<Item[]>();
		misskeyApiMock
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);

		const paginator = new Paginator('i/favorites', {});

		const firstInit = paginator.init();
		const reload = paginator.reload();

		first.resolve([item('a')]);
		await firstInit;
		second.resolve([item('b'), item('a')]);
		await reload;

		expect(paginator.items.value.map(x => x.id)).toEqual(['b', 'a']);
	});

	test('古い取得が失敗しても、新しい取得の結果はエラー扱いにならない', async () => {
		const first = deferred<Item[]>();
		const second = deferred<Item[]>();
		misskeyApiMock
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);

		const paginator = new Paginator('i/favorites', {});

		const firstInit = paginator.init();
		const reload = paginator.reload();

		second.resolve([item('a')]);
		await reload;
		first.reject(new Error('network error'));
		await firstInit;

		expect(paginator.error.value).toBe(false);
		expect(paginator.items.value.map(x => x.id)).toEqual(['a']);
	});

	test('fetchOlder() の取得中に reload() されたら、古いページは一覧に混ざらない', async () => {
		const older = deferred<Item[]>();
		const reloaded = deferred<Item[]>();
		misskeyApiMock
			.mockResolvedValueOnce([item('c'), item('b')])
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(reloaded.promise);

		const paginator = new Paginator('i/favorites', {});
		await paginator.init();

		const fetchOlder = paginator.fetchOlder();
		expect(paginator.fetchingOlder.value).toBe(true);
		const reload = paginator.reload();
		expect(paginator.fetchingOlder.value).toBe(false);

		reloaded.resolve([item('c')]);
		await reload;
		older.resolve([item('a')]);
		await fetchOlder;

		expect(paginator.items.value.map(x => x.id)).toEqual(['c']);
		expect(paginator.fetchingOlder.value).toBe(false);
	});

	test('reload() 前の fetchOlder() の応答が、reload() 後に始めた fetchOlder() の取得中の状態を解除しない', async () => {
		const staleOlder = deferred<Item[]>();
		const newOlder = deferred<Item[]>();
		misskeyApiMock
			.mockResolvedValueOnce([item('c')])
			.mockReturnValueOnce(staleOlder.promise)
			.mockResolvedValueOnce([item('c')])
			.mockReturnValueOnce(newOlder.promise);

		const paginator = new Paginator('i/favorites', {});
		await paginator.init();

		const staleFetch = paginator.fetchOlder();
		await paginator.reload();
		const newFetch = paginator.fetchOlder();
		expect(paginator.fetchingOlder.value).toBe(true);

		staleOlder.resolve([item('x')]);
		await staleFetch;
		expect(paginator.fetchingOlder.value).toBe(true);

		newOlder.resolve([item('b')]);
		await newFetch;
		expect(paginator.fetchingOlder.value).toBe(false);
		expect(paginator.items.value.map(x => x.id)).toEqual(['c', 'b']);
	});

	test('fetchNewer() の取得中に reload() されたら、古い応答は一覧に混ざらない', async () => {
		const newer = deferred<Item[]>();
		const reloaded = deferred<Item[]>();
		misskeyApiMock
			.mockResolvedValueOnce([item('b')])
			.mockReturnValueOnce(newer.promise)
			.mockReturnValueOnce(reloaded.promise);

		const paginator = new Paginator('i/favorites', {});
		await paginator.init();

		const fetchNewer = paginator.fetchNewer();
		const reload = paginator.reload();

		reloaded.resolve([item('b')]);
		await reload;
		newer.resolve([item('c')]);
		await fetchNewer;

		expect(paginator.items.value.map(x => x.id)).toEqual(['b']);
		expect(paginator.fetchingNewer.value).toBe(false);
	});
});
