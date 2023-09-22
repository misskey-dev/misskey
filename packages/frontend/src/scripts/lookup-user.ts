/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

export async function lookupUser() {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.usernameOrUserId,
	});
	if (canceled) return;

	const show = (user) => {
		os.pageWindow(`/admin/user/${user.id}`);
	};

	const usernamePromise = os.api('users/show', Misskey.acct.parse(result));
	const idPromise = os.api('users/show', { userId: result });
	let _notFound = false;
	const notFound = () => {
		if (_notFound) {
			os.alert({
				type: 'error',
				text: i18n.ts.noSuchUser,
			});
		} else {
			_notFound = true;
		}
	};
	usernamePromise.then(show).catch(err => {
		if (err.code === 'NO_SUCH_USER') {
			notFound();
		}
	});
	idPromise.then(show).catch(err => {
		notFound();
	});
}
