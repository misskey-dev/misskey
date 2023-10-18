export type FetchFunction<K, V> = (key: K) => Promise<V>;

type ResolveReject<V> = Parameters<ConstructorParameters<typeof Promise<V>>[0]>;

type ResolverPair<V> = {
	resolve: ResolveReject<V>[0];
	reject: ResolveReject<V>[1];
};

export class DebounceLoader<K, V> {
	private resolverMap = new Map<K, ResolverPair<V>>();
	private promiseMap = new Map<K, Promise<V>>();
	private resolvedPromise = Promise.resolve();
	constructor(private loadFn: FetchFunction<K, V>) {}

	public load(key: K): Promise<V> {
		const promise = this.promiseMap.get(key);
		if (typeof promise !== 'undefined') {
			return promise;
		}

		const isFirst = this.promiseMap.size === 0;
		const newPromise = new Promise<V>((resolve, reject) => {
			this.resolverMap.set(key, { resolve, reject });
		});
		this.promiseMap.set(key, newPromise);

		if (isFirst) {
			this.enqueueDebouncedLoadJob();
		}

		return newPromise;
	}

	private runDebouncedLoad(): void {
		const resolvers = [...this.resolverMap];
		this.resolverMap.clear();
		this.promiseMap.clear();

		for (const [key, { resolve, reject }] of resolvers) {
			this.loadFn(key).then(resolve, reject);
		}
	}

	private enqueueDebouncedLoadJob(): void {
		this.resolvedPromise.then(() => {
			process.nextTick(() => {
				this.runDebouncedLoad();
			});
		});
	}
}
