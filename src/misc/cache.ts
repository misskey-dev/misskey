export class Cache<T> {
	private cache: Map<string | null, { date: number; value: T; }>;
	private lifetime: number;

	constructor(lifetime: Cache<never>['lifetime']) {
		this.cache = new Map();
		this.lifetime = lifetime;
	}

	public set(key: string | null, value: T):void {
		this.cache.set(key, {
			date: Date.now(),
			value
		});
	}

	public get(key: string | null): T | null {
		const cached = this.cache.get(key);
		if (cached == null) return null;
		if ((Date.now() - cached.date) > this.lifetime) {
			this.cache.delete(key);
			return null;
		}
		return cached.value;
	}
}
