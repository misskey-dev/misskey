/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedEmojiSimpleSchema = v.object({
	aliases: v.array(mi.idString()),
	name: v.string(),
	category: v.nullable(v.string()),
	url: v.string(),
	localOnly: v.optional(v.boolean()),
	isSensitive: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(mi.idString())),
});
mi.defineEntity('EmojiSimple', packedEmojiSimpleSchema);

export type PackedEmojiSimple = v.InferOutput<typeof packedEmojiSimpleSchema>;

export const packedEmojiDetailedSchema = v.object({
	id: mi.idString(),
	aliases: v.array(mi.idString()),
	name: v.string(),
	category: v.nullable(v.string()),
	host: v.nullable(v.pipe(v.string(), v.description('The local host is represented with `null`.'))),
	url: v.string(),
	license: v.nullable(v.string()),
	isSensitive: v.boolean(),
	localOnly: v.boolean(),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.array(mi.idString()),
});
mi.defineEntity('EmojiDetailed', packedEmojiDetailedSchema);

export type PackedEmojiDetailed = v.InferOutput<typeof packedEmojiDetailedSchema>;

export const packedEmojiDetailedAdminSchema = v.object({
	id: mi.idString(),
	updatedAt: v.nullable(mi.dateTimeString()),
	name: v.string(),
	host: v.nullable(v.pipe(v.string(), v.description('The local host is represented with `null`.'))),
	publicUrl: v.string(),
	originalUrl: v.string(),
	uri: v.nullable(v.string()),
	type: v.nullable(v.string()),
	aliases: v.array(mi.idString()),
	category: v.nullable(v.string()),
	license: v.nullable(v.string()),
	localOnly: v.boolean(),
	isSensitive: v.boolean(),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.array(v.object({
		id: v.pipe(v.string(), mi.format('misskey:id')),
		name: v.string(),
	})),
});
mi.defineEntity('EmojiDetailedAdmin', packedEmojiDetailedAdminSchema);

export type PackedEmojiDetailedAdmin = v.InferOutput<typeof packedEmojiDetailedAdminSchema>;
