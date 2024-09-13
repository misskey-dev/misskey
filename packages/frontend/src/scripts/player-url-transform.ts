/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { hostname } from '@@/js/config.js';

export function transformPlayerUrl(url: string): string {
	const urlObj = new URL(url);
	if (!['https:', 'http:'].includes(urlObj.protocol)) throw new Error('Invalid protocol');

	const urlParams = new URLSearchParams(urlObj.search);

	if (urlObj.hostname === 'player.twitch.tv') {
		// TwitchはCSPの制約あり
		// https://dev.twitch.tv/docs/embed/video-and-clips/
		urlParams.set('parent', hostname);
		urlParams.set('allowfullscreen', '');
		urlParams.set('autoplay', 'true');
	} else {
		urlParams.set('autoplay', '1');
		urlParams.set('auto_play', '1');
	}
	urlObj.search = urlParams.toString();

	return urlObj.toString();
}
