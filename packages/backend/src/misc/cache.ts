export class Cache<T> {
	public cache: Map<string | null, { date: number; value: T; }>;
	private lifetime: number;

	constructor(lifetime: Cache<never>['lifetime']) {
		this.cache = new Map();
		this.lifetime = lifetime;
	}

	public set(key: string | null, value: T): void {
		this.cache.set(key, {
			date: Date.now(),
			value,
		});
	}

	public get(key: string | null): T | undefined {
		const cached = this.cache.get(key);
		if (cached == null) return undefined;
		if ((Date.now() - cached.date) > this.lifetime) {
			this.cache.delete(key);
			return undefined;
		}
		return cached.value;
	}

	public delete(key: string | null) {
		this.cache.delete(key);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	public async fetch(key: string | null, fetcher: () => Promise<T>, validator?: (cachedValue: T) => boolean): Promise<T> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		this.set(key, value);
		return value;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	public async fetchMaybe(key: string | null, fetcher: () => Promise<T | undefined>, validator?: (cachedValue: T) => boolean): Promise<T | undefined> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		if (value !== undefined) {
			this.set(key, value);
		}
		return value;
	}
}
