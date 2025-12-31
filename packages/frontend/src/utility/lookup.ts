/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Router } from '@/router.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { mainRouter } from '@/router.js';
import { acct } from '@/filters/user';

export async function lookup(router?: Router) {
	const _router = router ?? mainRouter;

	const { canceled, result: temp } = await os.inputText({
		title: i18n.ts.lookup,
	});
	const query = temp ? temp.trim() : '';
	if (canceled || query.length <= 1) return;

	if (query.startsWith('@') && !query.includes(' ')) {
		_router.pushByPath(`/${query}`);
		return;
	}

	if (query.startsWith('#')) {
		_router.push('/tags/:tag', {
			params: {
				tag: query.substring(1),
			}
		});
		return;
	}

	if (query.startsWith('https://')) {
		const res = await apLookup(query);

		if (res.type === 'User') {
			_router.push('/@:acct/:page?', {
				params: {
					acct: acct(res.object),
				},
			});
		} else if (res.type === 'Note') {
			_router.push('/notes/:noteId/:initialTab?', {
				params: {
					noteId: res.object.id,
				},
			});
		}

		return;
	}
}

export async function apLookup(query: string) {
	const promise = misskeyApi('ap/show', {
		uri: query,
	});

	os.promiseDialog(promise, null, (err) => {
		let title = i18n.ts.somethingHappened;
		let text = err.message + '\n' + err.id;

		switch (err.id) {
			case '974b799e-1a29-4889-b706-18d4dd93e266':
				title = i18n.ts._remoteLookupErrors._federationNotAllowed.title;
				text = i18n.ts._remoteLookupErrors._federationNotAllowed.description;
				break;
			case '1a5eab56-e47b-48c2-8d5e-217b897d70db':
				title = i18n.ts._remoteLookupErrors._uriInvalid.title;
				text = i18n.ts._remoteLookupErrors._uriInvalid.description;
				break;
			case '81b539cf-4f57-4b29-bc98-032c33c0792e':
				title = i18n.ts._remoteLookupErrors._requestFailed.title;
				text = i18n.ts._remoteLookupErrors._requestFailed.description;
				break;
			case '70193c39-54f3-4813-82f0-70a680f7495b':
				title = i18n.ts._remoteLookupErrors._responseInvalid.title;
				text = i18n.ts._remoteLookupErrors._responseInvalid.description;
				break;
			case 'dc94d745-1262-4e63-a17d-fecaa57efc82':
				title = i18n.ts._remoteLookupErrors._noSuchObject.title;
				text = i18n.ts._remoteLookupErrors._noSuchObject.description;
				break;
		}

		os.alert({
			type: 'error',
			title,
			text,
		});
	}, i18n.ts.fetchingAsApObject);

	return await promise;
}
