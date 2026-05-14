/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>;

	const timeoutPromise = new Promise<never>((_, reject) => {
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		timeoutId = setTimeout(() => {
			reject(new Error('Operation timed out'));
		}, ms);
	});

	return Promise.race([promise, timeoutPromise])
		.finally(() => {
			// workerで実行される可能性がある
			// eslint-disable-next-line no-restricted-globals
			clearTimeout(timeoutId);
		});
}
