/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type Job<V> = {
	value: V;
	timer: NodeJS.Timeout;
};

// TODO: redis使えるようにする
export class CollapsedQueue<K, V> {
	private jobs: Map<K, Job<V>> = new Map();

	constructor(
		private timeout: number,
		private collapse: (oldValue: V, newValue: V) => V,
		private perform: (key: K, value: V) => Promise<void>,
	) {}

	enqueue(key: K, value: V) {
		if (this.jobs.has(key)) {
			const old = this.jobs.get(key)!;
			const merged = this.collapse(old.value, value);
			this.jobs.set(key, { ...old, value: merged });
		} else {
			const timer = setTimeout(() => {
				const job = this.jobs.get(key)!;
				this.jobs.delete(key);
				this.perform(key, job.value);
			}, this.timeout);
			this.jobs.set(key, { value, timer });
		}
	}

	async performAllNow() {
		const entries = [...this.jobs.entries()];
		this.jobs.clear();
		for (const [_key, job] of entries) {
			clearTimeout(job.timer);
		}
		await Promise.allSettled(entries.map(([key, job]) => this.perform(key, job.value)));
	}
}
