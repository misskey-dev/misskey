/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedHashtagSchema = v.object({
	tag: mi.example(v.string(), 'misskey'),
	mentionedUsersCount: v.number(),
	mentionedLocalUsersCount: v.number(),
	mentionedRemoteUsersCount: v.number(),
	attachedUsersCount: v.number(),
	attachedLocalUsersCount: v.number(),
	attachedRemoteUsersCount: v.number(),
});
mi.defineEntity('Hashtag', packedHashtagSchema);

export type PackedHashtag = v.InferOutput<typeof packedHashtagSchema>;
