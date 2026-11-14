/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { host } from '@@/js/config.js';
import { store } from '@/store.js';

export async function getAccountFromId(id: string): Promise<{ id: string; token: string } | undefined> {
	await store.ready;
	const token = store.s.accountTokens[host + '/' + id];
	if (!token) {
		console.log('Accounts are not recorded');
		return undefined;
	}
	return { id, token };
}
