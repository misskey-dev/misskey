/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function assertNever(x: never): never {
	throw new Error(`Unexpected type: ${(x as any)?.type ?? x}`);
}

export function assertType<T>(node: unknown): asserts node is T {
}
