/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { query } from './url.js';

export class MediaProxy {
	private serverMetadata: Misskey.entities.MetaDetailed;
	private url: string;

	constructor(serverMetadata: Misskey.entities.MetaDetailed, url: string) {
		this.serverMetadata = serverMetadata;
		this.url = url;
	}

	public getProxiedImageUrl(imageUrl: string, type?: 'preview' | 'emoji' | 'avatar', mustOrigin = false, noFallback = false): string {
		const localProxy = `${this.url}/proxy`;
		let _imageUrl = imageUrl;

		if (imageUrl.startsWith(this.serverMetadata.mediaProxy + '/') || imageUrl.startsWith('/proxy/') || imageUrl.startsWith(localProxy + '/')) {
			// もう既にproxyっぽそうだったらurlを取り出す
			_imageUrl = (new URL(imageUrl)).searchParams.get('url') ?? imageUrl;
		}

		return `${mustOrigin ? localProxy : this.serverMetadata.mediaProxy}/${
			type === 'preview' ? 'preview.webp'
			: 'image.webp'
		}?${query({
			url: _imageUrl,
			...(!noFallback ? { 'fallback': '1' } : {}),
			...(type ? { [type]: '1' } : {}),
			...(mustOrigin ? { origin: '1' } : {}),
		})}`;
	}

	public getProxiedImageUrlNullable(imageUrl: string | null | undefined, type?: 'preview'): string | null {
		if (imageUrl == null) return null;
		return this.getProxiedImageUrl(imageUrl, type);
	}

	public getStaticImageUrl(baseUrl: string): string {
		const u = baseUrl.startsWith('http') ? new URL(baseUrl) : new URL(baseUrl, this.url);

		if (u.href.startsWith(`${this.url}/emoji/`)) {
			// もう既にemojiっぽそうだったらsearchParams付けるだけ
			u.searchParams.set('static', '1');
			return u.href;
		}

		if (u.href.startsWith(this.serverMetadata.mediaProxy + '/')) {
			// もう既にproxyっぽそうだったらsearchParams付けるだけ
			u.searchParams.set('static', '1');
			return u.href;
		}

		return `${this.serverMetadata.mediaProxy}/static.webp?${query({
			url: u.href,
			static: '1',
		})}`;
	}
}
