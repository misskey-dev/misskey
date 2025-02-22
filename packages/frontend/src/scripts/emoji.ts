/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { customEmojisMap } from '@/custom-emojis.js';
import { getProxiedImageUrl } from './media-proxy.js';

export function getCustomEmojiName(name: string) {
	return (name.startsWith(':') ? name.slice(1, -1) : name).replace('@.', '');
}

export function resolveCustomEmojiUrl(name: string, host?: string, useOriginalSize = false, mustOrigin = false) {
	const emojiName = getCustomEmojiName(name);
	const isLocal = !host && (name.endsWith('@.') || !name.includes('@'));

	const rawUrl = (() => {
		if (isLocal) {
			return customEmojisMap.get(emojiName)?.url ?? null;
		} else {
			return host ? `/emoji/${emojiName}@${host}.webp` : `/emoji/${emojiName}.webp`;
		}
	})();

	if (!rawUrl) {
		return null;
	}

	if (rawUrl.startsWith('/emoji/') || useOriginalSize && isLocal) {
		return rawUrl;
	} else {
		return getProxiedImageUrl(rawUrl, useOriginalSize ? undefined : 'emoji', mustOrigin, true);
	}
}
