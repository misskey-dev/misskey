/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class TimeoutError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'TimeoutError';
	}
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>;

	const timeoutPromise = new Promise<never>((_, reject) => {
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		timeoutId = setTimeout(() => {
			reject(new TimeoutError());
		}, ms);
	});

	return Promise.race([promise, timeoutPromise])
		.finally(() => {
			// workerで実行される可能性がある
			// eslint-disable-next-line no-restricted-globals
			clearTimeout(timeoutId);
		});
}
