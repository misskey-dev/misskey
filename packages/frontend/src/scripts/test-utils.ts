/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function tick(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	await new Promise((globalThis.requestIdleCallback ?? setTimeout) as never);
}
