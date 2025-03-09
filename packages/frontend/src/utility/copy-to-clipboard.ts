/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Clipboardに値をコピー(TODO: 文字列以外も対応)
 */
export function copyToClipboard(input: string | null) {
	if (input) navigator.clipboard.writeText(input);
};
