/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { CustomEmojiService, fetchEmojisHostTypes, fetchEmojisSortKeys } from '@/core/CustomEmojiService.js';
import { IdService } from '@/core/IdService.js';
import { packedEmojiDetailedAdminSchema } from '@/models/schema/emoji.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'read:admin:emoji',

	res: v.object({
		emojis: v.array(packedEmojiDetailedAdminSchema),
		count: mi.integer(),
		allCount: mi.integer(),
		allPages: mi.integer(),
	}),
} as const;

export const paramDef = v.object({
	query: v.optional(v.nullable(v.object({
		updatedAtFrom: v.optional(v.string()),
		updatedAtTo: v.optional(v.string()),
		name: v.optional(v.string()),
		host: v.optional(v.string()),
		uri: v.optional(v.string()),
		publicUrl: v.optional(v.string()),
		originalUrl: v.optional(v.string()),
		type: v.optional(v.string()),
		aliases: v.optional(v.string()),
		category: v.optional(v.string()),
		license: v.optional(v.string()),
		isSensitive: v.optional(v.boolean()),
		localOnly: v.optional(v.boolean()),
		hostType: v.optional(v.picklist([...fetchEmojisHostTypes]), 'all'),
		roleIds: v.optional(v.array(mi.misskeyId())),
	}))),
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	page: v.optional(mi.integer()),
	sortKeys: v.optional(v.array(v.picklist([...fetchEmojisSortKeys])), ['-id']),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private customEmojiService: CustomEmojiService,
		private emojiEntityService: EmojiEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : undefined);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : undefined);

			const q = ps.query;
			const result = await this.customEmojiService.fetchEmojis(
				{
					query: {
						updatedAtFrom: q?.updatedAtFrom,
						updatedAtTo: q?.updatedAtTo,
						name: q?.name,
						host: q?.host,
						uri: q?.uri,
						publicUrl: q?.publicUrl,
						type: q?.type,
						aliases: q?.aliases,
						category: q?.category,
						license: q?.license,
						isSensitive: q?.isSensitive,
						localOnly: q?.localOnly,
						hostType: q?.hostType,
						roleIds: q?.roleIds,
					},
					sinceId: sinceId,
					untilId: untilId,
				},
				{
					limit: ps.limit,
					page: ps.page,
					sortKeys: ps.sortKeys,
				},
			);

			return {
				emojis: await this.emojiEntityService.packDetailedAdminMany(result.emojis),
				count: result.count,
				allCount: result.allCount,
				allPages: result.allPages,
			};
		});
	}
}
