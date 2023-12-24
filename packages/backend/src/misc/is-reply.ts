/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiUser } from '@/models/User.js';

export function isReply(note: any, viewerId?: MiUser['id'] | undefined | null): boolean {
	return note.replyId && note.replyUserId !== note.userId && note.replyUserId !== viewerId;
}
