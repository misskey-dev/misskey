/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';
import { host } from '@@/js/config.js';
import { $i } from '@/i.js';
import { store } from '@/store.js';
import { prefer } from '@/preferences.js';
import { getAccountMenu, login, refreshCurrentAccount, switchAccount } from '@/accounts.js';
import { getAccountFromId as getFrontendAccountFromId } from '@/utility/get-account-from-id.js';
import { getAccountFromId as getSwAccountFromId, getAccounts as getSwAccounts } from '../../../sw/src/scripts/get-account-from-id.js';
import type { MenuButton } from '@/types/menu.js';

type PopupConfig = {
	done?: (res: { id: string; i: string; finished: true }) => Promise<void>;
	closed?: () => void;
};

const { idbMap, unisonReloadMock, signoutMock, popupConfigs } = vi.hoisted(() => {
	Object.defineProperty(window, 'indexedDB', {
		value: { open: () => ({}) },
		configurable: true,
	});
	localStorage.setItem('account', JSON.stringify({ id: 'current-user', token: 'current-token', username: 'current-user' }));
	return {
		idbMap: new Map<string, unknown>(),
		unisonReloadMock: vi.fn(),
		signoutMock: vi.fn(),
		popupConfigs: [] as PopupConfig[],
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
	popup: vi.fn((_component: unknown, _props: unknown, config: PopupConfig) => {
		popupConfigs.push(config);
		return { dispose: vi.fn() };
	}),
	waiting: () => () => {},
	popupMenu: vi.fn(),
	success: vi.fn(),
	alert: vi.fn(),
}));

vi.mock('@/signout.js', () => ({
	signout: signoutMock,
}));

vi.mock('@/utility/misskey-api.js', () => ({
	misskeyApi: vi.fn(async () => ({})),
}));

vi.mock('@/utility/unison-reload.js', () => ({
	unisonReload: unisonReloadMock,
	reloadChannel: { postMessage: vi.fn(), addEventListener: vi.fn() },
}));

describe('getAccountFromId', () => {
	beforeEach(async () => {
		unisonReloadMock.mockReset();
		signoutMock.mockReset();
		popupConfigs.length = 0;
		await idbKeyval.clear();
		vi.stubGlobal('origin', `https://${host}`);
		(prefer.s as Record<string, unknown>).accounts = [];
		(prefer as unknown as Record<string, unknown>).commit = (key: string, val: unknown) => {
			(prefer.s as Record<string, unknown>)[key] = val;
		};
		if ($i != null) {
			$i.id = 'current-user';
			$i.token = 'current-token';
			$i.username = 'current-user';
		}
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

	test('refreshCurrentAccountで削除済みアカウントのトークンがIndexedDBから削除される', async () => {
		if ($i == null) throw new Error('$i is not initialized');
		$i.id = 'user-deleted';
		$i.token = 'token-deleted';
		await store.set('accountTokens', { [`${host}/user-deleted`]: 'token-deleted' });
		vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ error: { id: 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a' } }), { status: 200 }));

		await refreshCurrentAccount();

		const base = idbMap.get('pizzax::base') as { accountTokens?: Record<string, string> } | undefined;
		expect(base?.accountTokens).toEqual({});
		expect(signoutMock).toHaveBeenCalledOnce();
	});

	test('switchAccountのサインイン完了時にaccountTokensがIndexedDBへ保存される', async () => {
		vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-switch', username: 'bob' }), { status: 200 }));

		await switchAccount(host, 'user-switch');
		const config = popupConfigs.at(-1);
		if (config?.done == null) throw new Error('signin dialog was not opened');
		await config.done({ id: 'user-switch', i: 'token-switch', finished: true });

		await vi.waitFor(() => {
			expect(unisonReloadMock).toHaveBeenCalledOnce();
		});
		const base = idbMap.get('pizzax::base') as { accountTokens?: Record<string, string> } | undefined;
		expect(base?.accountTokens).toEqual({ [`${host}/user-switch`]: 'token-switch' });
	});

	test('getAccountMenuのサインイン完了時にaccountTokensがIndexedDBへ保存される', async () => {
		(prefer.s as Record<string, unknown>).accounts = [[host, { id: 'user-menu', username: 'carol' }]];
		vi.spyOn(window, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-menu', username: 'carol' }), { status: 200 }));

		const menuItems = await getAccountMenu({ withExtraOperation: false });
		const item = menuItems[0] as MenuButton;
		await item.action(new PointerEvent('click'));
		const config = popupConfigs.at(-1);
		if (config?.done == null) throw new Error('signin dialog was not opened');
		await config.done({ id: 'user-menu', i: 'token-menu', finished: true });

		await vi.waitFor(() => {
			expect(unisonReloadMock).toHaveBeenCalledOnce();
		});
		const base = idbMap.get('pizzax::base') as { accountTokens?: Record<string, string> } | undefined;
		expect(base?.accountTokens).toEqual({ [`${host}/user-menu`]: 'token-menu' });
	});
});
