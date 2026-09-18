/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedAntennaSchema = v.object({
	id: mi.idString(),
	createdAt: mi.dateTimeString(),
	name: v.string(),
	keywords: v.array(v.array(v.string())),
	excludeKeywords: v.array(v.array(v.string())),
	src: v.picklist(['home', 'all', 'users', 'list', 'users_blacklist']),
	userListId: v.nullable(mi.idString()),
	users: v.array(v.string()),
	caseSensitive: v.pipe(v.boolean(), mi.openApi({ default: false })),
	localOnly: v.pipe(v.boolean(), mi.openApi({ default: false })),
	excludeBots: v.pipe(v.boolean(), mi.openApi({ default: false })),
	withReplies: v.pipe(v.boolean(), mi.openApi({ default: false })),
	withFile: v.boolean(),
	isActive: v.boolean(),
	hasUnreadNote: v.pipe(v.boolean(), mi.openApi({ default: false })),
	notify: v.pipe(v.boolean(), mi.openApi({ default: false })),
	excludeNotesInSensitiveChannel: v.pipe(v.boolean(), mi.openApi({ default: false })),
});
mi.defineEntity('Antenna', packedAntennaSchema);

export type PackedAntenna = v.InferOutput<typeof packedAntennaSchema>;
