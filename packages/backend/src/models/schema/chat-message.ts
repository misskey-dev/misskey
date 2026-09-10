/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedChatRoomSchema } from '@/models/schema/chat-room.js';
import { packedDriveFileSchema } from '@/models/schema/drive-file.js';

export const packedChatMessageSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	fromUserId: v.string(),
	fromUser: packedUserLiteSchema,
	toUserId: v.nullish(v.string()),
	toUser: v.nullish(packedUserLiteSchema),
	toRoomId: v.nullish(v.string()),
	toRoom: v.nullish(packedChatRoomSchema),
	text: v.nullish(v.string()),
	fileId: v.nullish(v.string()),
	file: v.nullish(packedDriveFileSchema),
	isRead: v.optional(v.boolean()),
	reactions: v.array(v.object({
		reaction: v.string(),
		user: packedUserLiteSchema,
	})),
});
mi.defineEntity('ChatMessage', packedChatMessageSchema);

export type PackedChatMessage = v.InferOutput<typeof packedChatMessageSchema>;

export const packedChatMessageLiteSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	fromUserId: v.string(),
	fromUser: v.optional(packedUserLiteSchema),
	toUserId: v.nullish(v.string()),
	toRoomId: v.nullish(v.string()),
	text: v.nullish(v.string()),
	fileId: v.nullish(v.string()),
	file: v.nullish(packedDriveFileSchema),
	reactions: v.array(v.object({
		reaction: v.string(),
		user: v.nullish(packedUserLiteSchema),
	})),
});
mi.defineEntity('ChatMessageLite', packedChatMessageLiteSchema);

export type PackedChatMessageLite = v.InferOutput<typeof packedChatMessageLiteSchema>;

export const packedChatMessageLiteFor1on1Schema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	fromUserId: v.string(),
	toUserId: v.string(),
	text: v.nullish(v.string()),
	fileId: v.nullish(v.string()),
	file: v.nullish(packedDriveFileSchema),
	reactions: v.array(v.object({
		reaction: v.string(),
	})),
});
mi.defineEntity('ChatMessageLiteFor1on1', packedChatMessageLiteFor1on1Schema);

export type PackedChatMessageLiteFor1on1 = v.InferOutput<typeof packedChatMessageLiteFor1on1Schema>;

export const packedChatMessageLiteForRoomSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	fromUserId: v.string(),
	fromUser: packedUserLiteSchema,
	toRoomId: v.string(),
	text: v.nullish(v.string()),
	fileId: v.nullish(v.string()),
	file: v.nullish(packedDriveFileSchema),
	reactions: v.array(v.object({
		reaction: v.string(),
		user: packedUserLiteSchema,
	})),
});
mi.defineEntity('ChatMessageLiteForRoom', packedChatMessageLiteForRoomSchema);

export type PackedChatMessageLiteForRoom = v.InferOutput<typeof packedChatMessageLiteForRoomSchema>;
