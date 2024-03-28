/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { CustomEmojiService, FetchEmojisParams } from '@/core/CustomEmojiService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageCustomEmojis',
	kind: 'read:admin:emoji',

	res: {
		type: 'object',
		properties: {
			emojis: {
				type: 'array',
				items: {
					type: 'object',
					ref: 'EmojiDetailedAdmin',
				},
			},
			count: { type: 'integer' },
			allCount: { type: 'integer' },
			allPages: { type: 'integer' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: {
			type: 'object',
			nullable: true,
			properties: {
				updatedAtFrom: { type: 'string' },
				updatedAtTo: { type: 'string' },
				name: { type: 'string' },
				host: { type: 'string' },
				uri: { type: 'string' },
				publicUrl: { type: 'string' },
				originalUrl: { type: 'string' },
				type: { type: 'string' },
				aliases: { type: 'string' },
				category: { type: 'string' },
				license: { type: 'string' },
				isSensitive: { type: 'boolean' },
				localOnly: { type: 'boolean' },
				hostType: { type: 'string', enum: ['local', 'remote', 'all'], default: 'all' },
				roleIds: {
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
				},
			},
		},
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		page: { type: 'integer' },
		sort: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					key: {
						type: 'string',
						enum: [
							'id',
							'updatedAt',
							'name',
							'host',
							'uri',
							'publicUrl',
							'type',
							'aliases',
							'category',
							'license',
							'isSensitive',
							'localOnly',
							'roleIdsThatCanBeUsedThisEmojiAsReaction',
						],
						default: 'id',
					},
					direction: {
						type: 'string',
						enum: ['ASC', 'DESC'],
						default: 'DESC',
					},
				},
				required: ['key', 'direction'],
			},
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private customEmojiService: CustomEmojiService,
		private emojiEntityService: EmojiEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const params: FetchEmojisParams = {};

			if (ps.query) {
				params.query = {
					updatedAtFrom: ps.query.updatedAtFrom,
					updatedAtTo: ps.query.updatedAtTo,
					name: ps.query.name,
					host: ps.query.host,
					uri: ps.query.uri,
					publicUrl: ps.query.publicUrl,
					type: ps.query.type,
					aliases: ps.query.aliases,
					category: ps.query.category,
					license: ps.query.license,
					isSensitive: ps.query.isSensitive,
					localOnly: ps.query.localOnly,
					hostType: ps.query.hostType,
					roleIds: ps.query.roleIds,
				};
			}

			params.sinceId = ps.sinceId;
			params.untilId = ps.untilId;
			params.limit = ps.limit;
			params.page = ps.page;
			params.sort = ps.sort?.map(it => ({
				key: it.key,
				direction: it.direction,
			}));

			const result = await this.customEmojiService.fetchEmojis(params);

			return {
				emojis: await this.emojiEntityService.packDetailedAdminMany(result.emojis),
				count: result.count,
				allCount: result.allCount,
				allPages: result.allPages,
			};
		});
	}
}
