export class CollapsedQueue<K, V> {
	private jobs: Map<K, V> = new Map();

	constructor(
		private timeout: number,
		private collapse: (oldValue: V, newValue: V) => V,
		private doJob: (key: K, value: V) => void,
	) { }

	enqueue(key: K, value: V) {
		if (this.jobs.has(key)) {
			const old = this.jobs.get(key)!;
			const merged = this.collapse(old, value);
			this.jobs.set(key, merged);
		} else {
			this.jobs.set(key, value);
			setTimeout(() => {
				const value = this.jobs.get(key)!;
				this.jobs.delete(key);
				this.doJob(key, value);
			}, this.timeout);
		}
	}
}
