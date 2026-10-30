/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiNote } from '@/models/Note.js';
import type { PackedNote } from '@/models/schema/note.js';
import type { PackedNotification } from '@/models/schema/notification.js';

export function isInstanceMuted(note: PackedNote | MiNote, mutedInstances: Set<string>): boolean {
	if (mutedInstances.has(note.user?.host ?? '')) return true;
	if (mutedInstances.has(note.reply?.user?.host ?? '')) return true;
	if (mutedInstances.has(note.renote?.user?.host ?? '')) return true;

	return false;
}

export function isUserFromMutedInstance(notif: PackedNotification, mutedInstances: Set<string>): boolean {
	// `user` を持たない種別 (achievementEarned / app など) もあるので存在チェックしてから見る
	const host = 'user' in notif ? notif.user.host : undefined;
	if (mutedInstances.has(host ?? '')) return true;

	return false;
}
