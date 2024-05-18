/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function tick(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	await new Promise((globalThis.requestIdleCallback ?? setTimeout) as never);
}

/**
 * @see https://github.com/misskey-dev/misskey/issues/11267
 */
export function semaphore(counter = 0, waiting: (() => void)[] = []) {
	return {
		acquire: () => ++counter > 1 && new Promise<void>(resolve => waiting.push(resolve)),
		release: () => --counter && waiting.pop()?.(),
	};
}
