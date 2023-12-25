/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function isUserRelated(note: any, userIds: Set<string>, ignoreAuthor = false): boolean {
	if (userIds.has(note.userId) && !ignoreAuthor) {
		return true;
	}

	if (note.reply != null && note.reply.userId !== note.userId && userIds.has(note.reply.userId)) {
		return true;
	}

	if (note.renote != null && note.renote.userId !== note.userId && userIds.has(note.renote.userId)) {
		return true;
	}

	return false;
}
