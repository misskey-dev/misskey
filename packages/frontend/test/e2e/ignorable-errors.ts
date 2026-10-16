/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const IGNORABLE_ERROR_MESSAGES = [
	'The source image cannot be decoded',
	'ResizeObserver loop limit exceeded',
	'ResizeObserver loop completed with undelivered notifications',
] as const;

export function isIgnorableErrorMessage(message: string): boolean {
	return IGNORABLE_ERROR_MESSAGES.some((text) => message.includes(text));
}
