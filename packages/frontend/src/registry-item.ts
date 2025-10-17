/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { misskeyApi } from '@/utility/misskey-api.js';

export type Keys =
	'channelsLastReadedAt' | // DEPRECATED, stored registory(2025.1.xxx)
	'somethingElse';

export const miRegistoryItem = {
	async get(key: Keys) {
		try {
			return JSON.parse(await misskeyApi('i/registry/get', { scope: ['client'], key }));
		} catch (err) {
			if (err.code === 'NO_SUCH_KEY') return {};
			throw err;
		}
	},
	async set(key: Keys, payload) {
		await misskeyApi('i/registry/set', { scope: ['client'], key, value: JSON.stringify(payload) });
	},
};

