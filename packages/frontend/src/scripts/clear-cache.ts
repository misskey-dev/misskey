/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { unisonReload } from '@/scripts/unison-reload.js';
import * as os from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { fetchServerMetadata } from '@/server-metadata.js';

export async function clearCache() {
	os.waiting();
	miLocalStorage.removeItem('instance');
	miLocalStorage.removeItem('instanceCachedAt');
	miLocalStorage.removeItem('locale');
	miLocalStorage.removeItem('localeVersion');
	miLocalStorage.removeItem('theme');
	miLocalStorage.removeItem('emojis');
	miLocalStorage.removeItem('lastEmojisFetchedAt');
	await fetchServerMetadata(true);
	await fetchCustomEmojis(true);
	unisonReload();
}
