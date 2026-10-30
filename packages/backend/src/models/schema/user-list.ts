/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedUserListSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	name: v.string(),
	userIds: v.optional(v.array(mi.idString())),
	isPublic: v.boolean(),
});
mi.defineEntity('UserList', packedUserListSchema);

export type PackedUserList = v.InferOutput<typeof packedUserListSchema>;
