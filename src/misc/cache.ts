export class Cache<T> {
	private cache: Map<string | null, { date: number; value: T | null; }>;
	private lifetime: number;

	constructor(lifetime: Cache<never>['lifetime']) {
		this.cache = new Map();
		this.lifetime = lifetime;
	}

	public set(key: string | null, value: T | null): void {
		this.cache.set(key, {
			date: Date.now(),
			value
		});
	}

	public get(key: string | null): T | null | undefined {
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

	public async fetch(key: string | null, fetcher: () => Promise<T | null>): Promise<T | null> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			// Cache HIT
			return cachedValue;
		}

		// Cache MISS
		const value = await fetcher();
		this.set(key, value);
		return value;
	}
}
