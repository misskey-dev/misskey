/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { HashtagsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: v.array(v.string()),
} as const;

export const paramDef = v.object({
	limit: mi.limit({ max: 100, def: 10 }),
	query: v.string(),
	offset: v.optional(mi.integer(), 0),
});

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
