/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { notificationTypes, userExportableEntities } from '@/types.js';
import { packedNoteSchema } from '@/models/schema/note.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedNoteDraftSchema } from '@/models/schema/note-draft.js';
import { packedChatRoomInvitationSchema } from '@/models/schema/chat-room-invitation.js';
import { packedAchievementNameSchema } from '@/models/schema/achievement.js';
import { packedRoleSchema } from '@/models/schema/role.js';

/**
 * legacy の `baseSchema.properties` 相当。各 variant で spread してから `type` を上書きする
 * (JS のオブジェクトリテラルは spread 済みキーの位置を保つので、legacy と同じ
 * `id, createdAt, type, ...` の出力順になる)。
 */
const baseEntries = {
	id: mi.idString(),
	createdAt: mi.dateTimeString(),
	type: v.picklist([...notificationTypes, 'reaction:grouped', 'renote:grouped']),
};

// 判別キー `type` を持つ oneOf なので `v.variant` (cookbook R10)
export const packedNotificationSchema = v.variant('type', [
	v.object({
		...baseEntries,
		type: v.literal('note'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('mention'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('reply'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('renote'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('quote'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('reaction'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
		reaction: v.string(),
	}),
	v.object({
		...baseEntries,
		type: v.literal('pollEnded'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('scheduledNotePosted'),
		note: packedNoteSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('scheduledNotePostFailed'),
		noteDraft: packedNoteDraftSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('follow'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
	}),
	v.object({
		...baseEntries,
		type: v.literal('receiveFollowRequest'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
	}),
	v.object({
		...baseEntries,
		type: v.literal('followRequestAccepted'),
		user: packedUserLiteSchema,
		userId: mi.idString(),
		message: v.nullable(v.string()),
	}),
	v.object({
		...baseEntries,
		type: v.literal('roleAssigned'),
		role: packedRoleSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('chatRoomInvitationReceived'),
		invitation: packedChatRoomInvitationSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('achievementEarned'),
		achievement: packedAchievementNameSchema,
	}),
	v.object({
		...baseEntries,
		type: v.literal('exportCompleted'),
		exportedEntity: v.picklist([...userExportableEntities]),
		fileId: mi.idString(),
	}),
	v.object({
		...baseEntries,
		type: v.literal('login'),
	}),
	v.object({
		...baseEntries,
		type: v.literal('createToken'),
	}),
	v.object({
		...baseEntries,
		type: v.literal('app'),
		body: v.string(),
		header: v.nullable(v.string()),
		icon: v.nullable(v.string()),
	}),
	v.object({
		...baseEntries,
		type: v.literal('reaction:grouped'),
		note: packedNoteSchema,
		reactions: v.array(v.object({
			user: packedUserLiteSchema,
			reaction: v.string(),
		})),
	}),
	v.object({
		...baseEntries,
		type: v.literal('renote:grouped'),
		note: packedNoteSchema,
		users: v.array(packedUserLiteSchema),
	}),
	v.object({
		...baseEntries,
		type: v.literal('test'),
	}),
]);
mi.defineEntity('Notification', packedNotificationSchema);

export type PackedNotification = v.InferOutput<typeof packedNotificationSchema>;
