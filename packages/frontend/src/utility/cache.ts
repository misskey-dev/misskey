/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';

export class Cache<T> {
	private cachedAt: number | null = null;
	public value = ref<T | undefined>();
	private lifetime: number;
	private fetcher: () => Promise<T>;

	constructor(lifetime: Cache<never>['lifetime'], fetcher: () => Promise<T>) {
		this.lifetime = lifetime;
		this.fetcher = fetcher;
	}

	public set(value: T): void {
		this.cachedAt = Date.now();
		this.value.value = value;
	}

	private get(): T | undefined {
		if (this.cachedAt == null) return undefined;
		if ((Date.now() - this.cachedAt) > this.lifetime) {
			this.value.value = undefined;
			this.cachedAt = null;
			return undefined;
		}
		return this.value.value;
	}

	public delete() {
		this.cachedAt = null;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 */
	public async fetch(): Promise<T> {
		const cachedValue = this.get();
		if (cachedValue !== undefined) {
			// Cache HIT
			return cachedValue;
		}

		// Cache MISS
		const value = await this.fetcher();
		this.set(value);
		return value;
	}
}
