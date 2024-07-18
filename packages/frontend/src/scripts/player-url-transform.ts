/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { hostname } from '@/config.js';

export function transformPlayerUrl(url: string): string {
	const urlObj = new URL(url);
	if (!['https:', 'http:'].includes(urlObj.protocol)) throw new Error('Invalid protocol');

	const urlParams = new URLSearchParams(urlObj.search);

	// TwitchはCSPの制約あり
	// https://dev.twitch.tv/docs/embed/video-and-clips/
	if (urlObj.hostname === 'player.twitch.tv') {
		urlParams.set('parent', hostname);
		urlParams.set('allowfullscreen', '');
	}

	// Autoplay
	urlParams.set('autoplay', 'true');
	urlParams.set('auto_play', 'true');
	urlObj.search = urlParams.toString();

	return urlObj.toString();
}
