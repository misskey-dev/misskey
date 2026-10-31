/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';
import { host } from '@@/js/config.js';
import { store } from '@/store.js';
import { prefer } from '@/preferences.js';
import { login } from '@/accounts.js';
import { getAccountFromId as getFrontendAccountFromId } from '@/utility/get-account-from-id.js';
import { getAccountFromId as getSwAccountFromId, getAccounts as getSwAccounts } from '../../../sw/src/scripts/get-account-from-id.js';

const { idbMap, unisonReloadMock } = vi.hoisted(() => {
	Object.defineProperty(window, 'indexedDB', {
		value: { open: () => ({}) },
		configurable: true,
	});
	return {
		idbMap: new Map<string, unknown>(),
		unisonReloadMock: vi.fn(),
	};
});

vi.mock('idb-keyval', () => ({
	get: vi.fn(async (key: string) => {
		await Promise.resolve();
		return idbMap.get(key);
	}),
	set: vi.fn(async (key: string, val: unknown) => {
		await Promise.resolve();
		idbMap.set(key, val);
	}),
	del: vi.fn(async (key: string) => {
		idbMap.delete(key);
	}),
	clear: vi.fn(async () => {
		idbMap.clear();
	}),
}));

vi.mock('@/os.js', () => ({
	popup: () => ({ dispose: () => {} }),
	waiting: () => () => {},
	popupMenu: vi.fn(),
	success: vi.fn(),
	alert: vi.fn(),
}));

vi.mock('@/utility/unison-reload.js', () => ({
	unisonReload: unisonReloadMock,
	reloadChannel: { postMessage: vi.fn(), addEventListener: vi.fn() },
}));

describe('getAccountFromId', () => {
	beforeEach(async () => {
		unisonReloadMock.mockReset();
		await idbKeyval.clear();
		vi.stubGlobal('origin', `https://${host}`);
		(prefer.s as Record<string, unknown>).accounts = [];
		(prefer as unknown as Record<string, unknown>).commit = (key: string, val: unknown) => {
			(prefer.s as Record<string, unknown>)[key] = val;
		};
		await store.ready;
		await store.set('accountTokens', {});
	});

	test('Service Worker側でpizzax::baseのaccountTokensからアカウントを取得できる', async () => {
		await store.set('accountTokens', {
			[`${host}/user-1`]: 'token-1',
			[`${host}/user-2`]: 'token-2',
		});

		await expect(getSwAccounts()).resolves.toEqual([
			{ id: 'user-1', token: 'token-1' },
			{ id: 'user-2', token: 'token-2' },
		]);
		await expect(getSwAccountFromId('user-1')).resolves.toEqual({ id: 'user-1', token: 'token-1' });
		await expect(getSwAccountFromId('unknown')).resolves.toBeUndefined();
	});

	test('Service Worker側でaccountTokensが未記録の場合は空配列・undefinedを返す', async () => {
		await idbKeyval.clear();

		await expect(getSwAccounts()).resolves.toEqual([]);
		await expect(getSwAccountFromId('user-1')).resolves.toBeUndefined();
	});

	test('フロントエンド側でstoreのaccountTokensからアカウントを取得でき、未記録時も例外を投げない', async () => {
		await expect(getFrontendAccountFromId('user-1')).resolves.toBeUndefined();

		await store.set('accountTokens', {
			[`${host}/user-1`]: 'token-1',
		});

		await expect(getFrontendAccountFromId('user-1')).resolves.toEqual({ id: 'user-1', token: 'token-1' });
	});

	test('login時にリロード発火時点でaccountTokensがIndexedDBへ保存済みになる', async () => {
		vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-login', username: 'alice' }), { status: 200 }));

		let savedTokensAtReload: Record<string, string> | undefined;
		unisonReloadMock.mockImplementation(() => {
			const base = idbMap.get('pizzax::base') as { accountTokens?: Record<string, string> } | undefined;
			savedTokensAtReload = base?.accountTokens ? { ...base.accountTokens } : undefined;
		});

		await login('token-login');

		expect(unisonReloadMock).toHaveBeenCalledOnce();
		expect(savedTokensAtReload).toEqual({ [`${host}/user-login`]: 'token-login' });
	});
});
