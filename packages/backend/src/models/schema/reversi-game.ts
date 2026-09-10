/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const packedReversiGameLiteSchema = v.object({
	id: mi.idString(),
	createdAt: mi.dateTimeString(),
	startedAt: v.nullable(mi.dateTimeString()),
	endedAt: v.nullable(mi.dateTimeString()),
	isStarted: v.boolean(),
	isEnded: v.boolean(),
	user1Id: mi.idString(),
	user2Id: mi.idString(),
	user1: packedUserLiteSchema,
	user2: packedUserLiteSchema,
	winnerId: v.nullable(mi.idString()),
	winner: v.nullable(packedUserLiteSchema),
	surrenderedUserId: v.nullable(mi.idString()),
	timeoutUserId: v.nullable(mi.idString()),
	black: v.nullable(v.number()),
	bw: v.picklist(['random', '1', '2']),
	noIrregularRules: v.boolean(),
	isLlotheo: v.boolean(),
	canPutEverywhere: v.boolean(),
	loopedBoard: v.boolean(),
	timeLimitForEachTurn: v.number(),
});
mi.defineEntity('ReversiGameLite', packedReversiGameLiteSchema);

export type PackedReversiGameLite = v.InferOutput<typeof packedReversiGameLiteSchema>;

export const packedReversiGameDetailedSchema = v.object({
	id: mi.idString(),
	createdAt: mi.dateTimeString(),
	startedAt: v.nullable(mi.dateTimeString()),
	endedAt: v.nullable(mi.dateTimeString()),
	isStarted: v.boolean(),
	isEnded: v.boolean(),
	// json-schema 側も properties 無しの object で無検証だったため mi.anyObject() を維持 (cookbook R1)
	form1: v.nullable(mi.anyObject()),
	form2: v.nullable(mi.anyObject()),
	user1Ready: v.boolean(),
	user2Ready: v.boolean(),
	user1Id: mi.idString(),
	user2Id: mi.idString(),
	user1: packedUserLiteSchema,
	user2: packedUserLiteSchema,
	winnerId: v.nullable(mi.idString()),
	winner: v.nullable(packedUserLiteSchema),
	surrenderedUserId: v.nullable(mi.idString()),
	timeoutUserId: v.nullable(mi.idString()),
	black: v.nullable(v.number()),
	bw: v.picklist(['random', '1', '2']),
	noIrregularRules: v.boolean(),
	isLlotheo: v.boolean(),
	canPutEverywhere: v.boolean(),
	loopedBoard: v.boolean(),
	timeLimitForEachTurn: v.number(),
	logs: v.array(v.array(v.number())),
	map: v.array(v.string()),
});
mi.defineEntity('ReversiGameDetailed', packedReversiGameDetailedSchema);

export type PackedReversiGameDetailed = v.InferOutput<typeof packedReversiGameDetailedSchema>;
