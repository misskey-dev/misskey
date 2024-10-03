/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { get } from '@/scripts/idb-proxy.js';

export async function getAccountFromId(id: string) {
	const accounts = await get('accounts') as { token: string; id: string; }[];
	if (!accounts) console.log('Accounts are not recorded');
	return accounts.find(account => account.id === id);
}
