/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { get } from 'idb-keyval';
import * as Misskey from 'misskey-js';

export async function getAccountFromId(id: string): Promise<Pick<Misskey.entities.SignupResponse, 'id' | 'token'> | undefined> {
	const accounts = await get<Pick<Misskey.entities.SignupResponse, 'id' | 'token'>[]>('accounts');
	if (!accounts) {
		console.log('Accounts are not recorded');
		return;
	}
	return accounts.find(e => e.id === id);
}
