/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiUser } from '@/models/_.js';

interface NoteLike {
	userId: MiUser['id'];
	reply?: NoteLike | null;
	renote?: NoteLike | null;
	replyUserId?: MiUser['id'] | null;
	renoteUserId?: MiUser['id'] | null;
}

export function isUserRelated(note: NoteLike | null | undefined, userIds: Set<string>, ignoreAuthor = false): boolean {
	if (!note) {
		return false;
	}

	if (userIds.has(note.userId) && !ignoreAuthor) {
		return true;
	}

	const replyUserId = note.replyUserId ?? note.reply?.userId;
	if (replyUserId != null && replyUserId !== note.userId && userIds.has(replyUserId)) {
		return true;
	}

	const renoteUserId = note.renoteUserId ?? note.renote?.userId;
	if (renoteUserId != null && renoteUserId !== note.userId && userIds.has(renoteUserId)) {
		return true;
	}

	return false;
}

