/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { Router } from '@/nirax.js';
import { mainRouter } from '@/router/main.js';

export async function lookup(router?: Router) {
	const _router = router ?? mainRouter;

	const { canceled, result: temp } = await os.inputText({
		title: i18n.ts.lookup,
	});
	const query = temp ? temp.trim() : '';
	if (canceled || query.length <= 1) return;

	if (query.startsWith('@') && !query.includes(' ')) {
		_router.push(`/${query}`);
		return;
	}

	if (query.startsWith('#')) {
		_router.push(`/tags/${encodeURIComponent(query.substring(1))}`);
		return;
	}

	if (query.startsWith('https://')) {
		const promise = misskeyApi('ap/show', {
			uri: query,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			_router.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			_router.push(`/notes/${res.object.id}`);
		}

		return;
	}
}
