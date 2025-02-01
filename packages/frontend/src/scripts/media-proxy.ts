/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { appendQuery, query } from '@/scripts/url.js';
import { url } from '@/config.js';
import { instance } from '@/instance.js';

export function getProxiedImageUrl(imageUrl: string, type?: 'preview' | 'emoji' | 'avatar', mustOrigin = false, noFallback = false): string {
	const localProxy = `${url}/proxy`;

	if (imageUrl.startsWith(instance.mediaProxy + '/') || imageUrl.startsWith('/proxy/') || imageUrl.startsWith(localProxy + '/')) {
		// もう既にproxyっぽそうだったらurlを取り出す
		const url = (new URL(imageUrl)).searchParams.get('url');
		if (url) {
			imageUrl = url;
		} else if (imageUrl.startsWith(instance.mediaProxy + '/')) {
			imageUrl = imageUrl.slice(instance.mediaProxy.length + 1);
		} else if (imageUrl.startsWith('/proxy/')) {
			imageUrl = imageUrl.slice('/proxy/'.length);
		} else if (imageUrl.startsWith(localProxy + '/')) {
			imageUrl = imageUrl.slice(localProxy.length + 1);
		}
	}

	return appendQuery(
		`${mustOrigin ? localProxy : instance.mediaProxy}/${type === 'preview' ? 'preview' : 'image'}/${encodeURIComponent(imageUrl)}`,
		query({
			...(!noFallback ? { 'fallback': '1' } : {}),
			...(type ? { [type]: '1' } : {}),
			...(mustOrigin ? { origin: '1' } : {}),
		}),
	);
}

export function getProxiedImageUrlNullable(imageUrl: string | null | undefined, type?: 'preview'): string | null {
	if (imageUrl == null) return null;
	return getProxiedImageUrl(imageUrl, type);
}

export function getStaticImageUrl(baseUrl: string): string {
	const u = baseUrl.startsWith('http') ? new URL(baseUrl) : new URL(baseUrl, url);

	if (u.href.startsWith(`${url}/emoji/`)) {
		// もう既にemojiっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	if (u.href.startsWith(instance.mediaProxy + '/')) {
		// もう既にproxyっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	return appendQuery(
		`${instance.mediaProxy}/static/${encodeURIComponent(u.href)}`,
		query({ static: '1' }),
	);
}
