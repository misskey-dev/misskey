/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function isNotNull<T extends NonNullable<unknown>>(input: T | undefined | null): input is T {
	return input != null;
}
