/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedChatRoomSchema } from '@/models/schema/chat-room.js';

export const packedChatRoomMembershipSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	userId: v.string(),
	user: v.optional(packedUserLiteSchema),
	roomId: v.string(),
	room: v.optional(packedChatRoomSchema),
});
mi.defineEntity('ChatRoomMembership', packedChatRoomMembershipSchema);

export type PackedChatRoomMembership = v.InferOutput<typeof packedChatRoomMembershipSchema>;
