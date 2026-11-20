/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * 非同期処理の同時実行数を制限するセマフォ。
 * 上限に達している間に来た処理は、到着順に待たせる。
 */
export class Semaphore {
	private running = 0;
	private readonly waiters: (() => void)[] = [];

	constructor(private readonly limit: number) {
		if (!Number.isInteger(limit) || limit < 1) {
			throw new RangeError(`Semaphore limit must be a positive integer: ${limit}`);
		}
	}

	/**
	 * 空きを待ってから fn を実行する。fn が成功しても失敗しても枠は解放される。
	 */
	public async run<T>(fn: () => Promise<T>): Promise<T> {
		await this.acquire();
		try {
			return await fn();
		} finally {
			this.release();
		}
	}

	private acquire(): Promise<void> {
		if (this.running < this.limit) {
			this.running++;
			return Promise.resolve();
		}
		return new Promise(resolve => this.waiters.push(resolve));
	}

	private release(): void {
		const next = this.waiters.shift();
		if (next != null) {
			// 実行中の数は変えずに、枠をそのまま次の処理へ引き継ぐ
			next();
		} else {
			this.running--;
		}
	}
}
