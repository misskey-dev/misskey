/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function normalizeForSearch(tag: string): string {
	// ref.
	// - https://analytics-note.xyz/programming/unicode-normalization-forms/
	// - https://maku77.github.io/js/string/normalize.html
	return tag.normalize('NFKC').toLowerCase();
}
