/*
 * SPDX-FileCopyrightText: Isaac Z. Schlueter and Contributors of https://github.com/isaacs/ttlcache
 * SPDX-License-Identifier: ISC
 *
 * This file is derived from the project that has licensed under the ISC license.
 * This file SHOULD NOT be considered as a part of this project that has licensed under AGPL-3.0-only
 * Adapted from https://github.com/isaacs/ttlcache/blob/b6002f971e122e3b35e23d00ac6a8365d505c14d/examples/rate-limiter-window.ts
 */

import TTLCache from '@isaacs/ttlcache';
import type { Options as TTLCacheOptions } from '@isaacs/ttlcache';

export interface Options {
	duration: number;
	max: number;
}

interface RLEntryOptions extends TTLCacheOptions<number, boolean> {
	onEmpty: () => void;
}

class RLEntry extends TTLCache<number, boolean> {
	onEmpty: () => void;

	constructor(options: RLEntryOptions) {
		super(options);
		this.onEmpty = options.onEmpty;
	}

	purgeStale() {
		const ret = super.purgeStale();
		if (this.size === 0 && ret) {
			this.onEmpty();
		}
		return ret;
	}
}

export class RateLimiter<K> extends Map<K, TTLCache<number, boolean>> {
	duration: number;
	max: number;

	constructor(options: Options) {
		super();
		this.duration = options.duration;
		this.max = options.max;
	}

	hit(key: K) {
		const c =
			super.get(key) ??
			new RLEntry({
				ttl: this.duration,
				onEmpty: () => this.delete(key),
			});

		this.set(key, c);

		if (c.size > this.max) {
			// rejected, too many hits within window
			return false;
		}
		c.set(performance.now(), true);
		return true;
	}

	count(key: K) {
		const c = super.get(key);
		return c ? c.size : 0;
	}
}
