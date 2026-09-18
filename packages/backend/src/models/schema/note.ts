/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedDriveFileSchema } from '@/models/schema/drive-file.js';
import type { PackedUserLite } from '@/models/schema/user.js';
import type { PackedDriveFile } from '@/models/schema/drive-file.js';

/**
 * Note は `reply` / `renote` で自分自身を含む循環スキーマなので、出力型を手書きして
 * `v.GenericSchema<...>` で明示注釈する (cookbook R13)。
 */
// NOTE: interface ではなく type alias にしているのは、interface には implicit index signature が
// 付かず `Cloneable` / `JsonValue` のような index signature 前提の型へ代入できなくなるため
// (legacy の `Packed<'Note'>` は型エイリアス由来だったので代入できていた)。
export type PackedNote = {
	id: string;
	createdAt: string;
	deletedAt?: string | null;
	text: string | null;
	cw?: string | null;
	userId: string;
	user: PackedUserLite;
	replyId?: string | null;
	renoteId?: string | null;
	reply?: PackedNote | null;
	renote?: PackedNote | null;
	isHidden?: boolean;
	visibility: 'public' | 'home' | 'followers' | 'specified';
	mentions?: string[];
	visibleUserIds?: string[];
	fileIds?: string[];
	files?: PackedDriveFile[];
	tags?: string[];
	poll?: {
		expiresAt?: string | null;
		multiple: boolean;
		choices: {
			isVoted: boolean;
			text: string;
			votes: number;
		}[];
	} | null;
	emojis?: Record<string, string>;
	channelId?: string | null;
	channel?: {
		id: string;
		name: string;
		color: string;
		isSensitive: boolean;
		allowRenoteToExternal: boolean;
		userId: string | null;
	} | null;
	localOnly?: boolean;
	reactionAcceptance: 'likeOnly' | 'likeOnlyForRemote' | 'nonSensitiveOnly' | 'nonSensitiveOnlyForLocalLikeOnlyForRemote' | null;
	reactionEmojis: Record<string, string>;
	reactions: Record<string, number>;
	reactionCount: number;
	renoteCount: number;
	repliesCount: number;
	uri?: string;
	url?: string;
	reactionAndUserPairCache?: string[];
	clippedCount?: number;
	hasPoll?: boolean;
	myReaction?: string | null;
};

// NOTE: user.ts / drive-file.ts とは ESM の循環 import になるため、参照は `v.lazy()` 経由にする
export const packedNoteSchema: v.GenericSchema<PackedNote> = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	deletedAt: v.nullish(mi.dateTimeString()),
	text: v.nullable(v.string()),
	cw: v.nullish(v.string()),
	userId: mi.idString(),
	user: v.lazy(() => packedUserLiteSchema),
	replyId: mi.example(v.nullish(mi.idString()), 'xxxxxxxxxx'),
	renoteId: mi.example(v.nullish(mi.idString()), 'xxxxxxxxxx'),
	reply: v.nullish(v.lazy(() => packedNoteSchema)),
	renote: v.nullish(v.lazy(() => packedNoteSchema)),
	isHidden: v.optional(v.boolean()),
	visibility: v.picklist(['public', 'home', 'followers', 'specified']),
	mentions: v.optional(v.array(mi.idString())),
	visibleUserIds: v.optional(v.array(mi.idString())),
	fileIds: v.optional(v.array(mi.idString())),
	files: v.optional(v.array(v.lazy(() => packedDriveFileSchema))),
	tags: v.optional(v.array(v.string())),
	poll: v.nullish(v.object({
		expiresAt: v.nullish(mi.dateTimeString()),
		multiple: v.boolean(),
		choices: v.array(v.object({
			isVoted: v.boolean(),
			text: v.string(),
			votes: v.number(),
		})),
	})),
	emojis: v.optional(v.record(v.string(), v.union([v.string()]))),
	channelId: mi.example(v.nullish(mi.idString()), 'xxxxxxxxxx'),
	channel: v.nullish(v.object({
		id: v.string(),
		name: v.string(),
		color: v.string(),
		isSensitive: v.boolean(),
		allowRenoteToExternal: v.boolean(),
		userId: v.nullable(v.string()),
	})),
	localOnly: v.optional(v.boolean()),
	reactionAcceptance: mi.nullableEnum(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote', null]),
	reactionEmojis: v.record(v.string(), v.union([v.string()])),
	reactions: v.record(v.string(), v.union([v.number()])),
	reactionCount: v.number(),
	renoteCount: v.number(),
	repliesCount: v.number(),
	uri: v.optional(v.string()),
	url: v.optional(v.string()),
	reactionAndUserPairCache: v.optional(v.array(v.string())),
	clippedCount: v.optional(v.number()),
	hasPoll: v.optional(v.boolean()),

	myReaction: v.nullish(v.string()),
});
mi.defineEntity('Note', packedNoteSchema);
