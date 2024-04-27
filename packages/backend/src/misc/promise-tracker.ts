/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const promiseRefs: Set<WeakRef<Promise<unknown>>> = new Set();

/**
 * This tracks promises that other modules decided not to wait for,
 * and makes sure they are all settled before fully closing down the server.
 */
export function trackPromise(promise: Promise<unknown>) {
	if (process.env.NODE_ENV !== 'test') {
		return;
	}
	const ref = new WeakRef(promise);
	promiseRefs.add(ref);
	promise.finally(() => promiseRefs.delete(ref));
}

export async function allSettled(): Promise<void> {
	await Promise.allSettled([...promiseRefs].map(r => r.deref()));
}
