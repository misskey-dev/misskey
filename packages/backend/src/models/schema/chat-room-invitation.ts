/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedChatRoomSchema } from '@/models/schema/chat-room.js';

export const packedChatRoomInvitationSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	userId: v.string(),
	user: packedUserLiteSchema,
	roomId: v.string(),
	room: packedChatRoomSchema,
});
mi.defineEntity('ChatRoomInvitation', packedChatRoomInvitationSchema);

export type PackedChatRoomInvitation = v.InferOutput<typeof packedChatRoomInvitationSchema>;
