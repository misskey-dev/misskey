/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiUser } from '@/models/User.js';

export function isReply(note: any, viewerId?: MiUser['id'] | null | undefined): boolean {
	return note.replyId && note.replyUserId !== note.userId && note.replyUserId !== viewerId;
}
