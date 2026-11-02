/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MediaProxy } from '@@/js/media-proxy.js';
import { url } from '@@/js/config.js';
import { instance } from '@/instance.js';

let _mediaProxy: MediaProxy | null = null;

export function getProxiedImageUrl(...args: Parameters<MediaProxy['getProxiedImageUrl']>): string {
	if (_mediaProxy == null) {
		_mediaProxy = new MediaProxy(instance, url);
	}

	return _mediaProxy.getProxiedImageUrl(...args);
}

export function getProxiedImageUrlNullable(...args: Parameters<MediaProxy['getProxiedImageUrlNullable']>): string | null {
	if (_mediaProxy == null) {
		_mediaProxy = new MediaProxy(instance, url);
	}

	return _mediaProxy.getProxiedImageUrlNullable(...args);
}

export function getStaticImageUrl(...args: Parameters<MediaProxy['getStaticImageUrl']>): string {
	if (_mediaProxy == null) {
		_mediaProxy = new MediaProxy(instance, url);
	}

	return _mediaProxy.getStaticImageUrl(...args);
}
