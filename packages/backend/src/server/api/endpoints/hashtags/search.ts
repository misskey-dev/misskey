/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import type { HashtagsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		query: { type: 'string' },
		offset: { type: 'integer', default: 0 },
	},
	required: ['query'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const hashtags = await this.hashtagsRepository.createQueryBuilder('tag')
				.where('tag.name like :q', { q: sqlLikeEscape(ps.query.toLowerCase()) + '%' })
				.orderBy('tag.mentionedLocalUsersCount', 'DESC')
				.groupBy('tag.id')
				.limit(ps.limit)
				.offset(ps.offset)
				.getMany();

			return hashtags.map(tag => tag.name);
		});
	}
}
