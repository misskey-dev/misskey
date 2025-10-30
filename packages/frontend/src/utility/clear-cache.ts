/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { unisonReload } from '@/utility/unison-reload.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { fetchInstance } from '@/instance.js';
import { clearAppliedThemeCache } from '@/theme.js';

export async function clearCache() {
	os.waiting();
	miLocalStorage.removeItem('instance');
	miLocalStorage.removeItem('instanceCachedAt');
	miLocalStorage.removeItem('emojis');
	miLocalStorage.removeItem('lastEmojisFetchedAt');
	clearAppliedThemeCache();
	await misskeyApiGet('clear-browser-cache', {}).catch(() => {
		// ignore
	});
	await fetchInstance(true);
	await fetchCustomEmojis(true);
	unisonReload();
}
