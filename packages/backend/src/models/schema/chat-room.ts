/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const packedChatRoomSchema = v.object({
	id: v.string(),
	createdAt: mi.dateTimeString(),
	ownerId: v.string(),
	owner: packedUserLiteSchema,
	name: v.string(),
	description: v.string(),
	isMuted: v.optional(v.boolean()),
	invitationExists: v.optional(v.boolean()),
});
mi.defineEntity('ChatRoom', packedChatRoomSchema);

export type PackedChatRoom = v.InferOutput<typeof packedChatRoomSchema>;
