/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function sqlLikeEscape(s: string) {
	return s.replace(/([%_])/g, '\\$1');
}
