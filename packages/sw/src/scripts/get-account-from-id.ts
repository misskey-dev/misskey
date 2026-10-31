/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { get } from 'idb-keyval';
import type * as Misskey from 'misskey-js';

type StoredAccount = Pick<Misskey.entities.SignupResponse, 'id' | 'token'>;

type PizzaxBaseState = {
	accountTokens?: Record<string, string>;
};

export async function getAccounts(): Promise<StoredAccount[]> {
	const baseState = await get<PizzaxBaseState>('pizzax::base');
	const accountTokens = baseState?.accountTokens;
	if (!accountTokens) {
		return [];
	}

	const host = (new URL(origin)).host;
	const accounts = new Map<string, string>();
	for (const [key, token] of Object.entries(accountTokens)) {
		if (typeof token !== 'string' || token.length === 0) continue;
		const slashIndex = key.lastIndexOf('/');
		if (slashIndex === -1) continue;
		const keyHost = key.slice(0, slashIndex);
		const id = key.slice(slashIndex + 1);
		if (!id) continue;
		if (keyHost === host || !accounts.has(id)) {
			accounts.set(id, token);
		}
	}

	return Array.from(accounts, ([id, token]) => ({ id, token }));
}

export async function getAccountFromId(id: string): Promise<StoredAccount | undefined> {
	const accounts = await getAccounts();
	if (accounts.length === 0) {
		console.log('Accounts are not recorded');
		return undefined;
	}
	return accounts.find(account => account.id === id);
}
