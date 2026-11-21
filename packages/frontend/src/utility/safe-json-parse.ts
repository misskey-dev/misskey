/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function safeJsonParse<T>(value: string | null | undefined, fallback: T, onError?: (err: unknown) => void): T {
	if (value == null) return fallback;

	try {
		return JSON.parse(value) as T;
	} catch (err) {
		onError?.(err);
		return fallback;
	}
}
