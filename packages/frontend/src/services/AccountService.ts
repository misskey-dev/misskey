/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { inject, injectable, container } from 'tsyringe';
import * as Misskey from 'misskey-js';
import { defineAsyncComponent, reactive, ref } from 'vue';
import { miLocalStorage } from '@/local-storage.js';

type Account = Misskey.entities.MeDetailed & { token: string };

const accountData = miLocalStorage.getItem('account');

const $i = accountData ? reactive(JSON.parse(accountData) as Account) : null;

@injectable()
export class AccountService {
	constructor(
	) {}

	public readonly i = $i;
}
