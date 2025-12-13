/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export async function tick(): Promise<void> {
	await new Promise((globalThis.requestIdleCallback ?? window.setTimeout) as never);
}
