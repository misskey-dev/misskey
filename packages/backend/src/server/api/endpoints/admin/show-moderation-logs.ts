/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ModerationLogsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogEntityService } from '@/core/entities/ModerationLogEntityService.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:show-moderation-log',

	res: v.array(v.object({
		id: mi.idString(),
		createdAt: mi.dateTimeString(),
		type: v.string(),
		info: mi.anyObject(),
		userId: mi.idString(),
		user: packedUserDetailedNotMeSchema,
	})),
} as const;

export const paramDef = v.object({
	limit: mi.limit({ max: 100, def: 10 }),
	sinceId: v.optional(mi.misskeyId()),
	untilId: v.optional(mi.misskeyId()),
	sinceDate: v.optional(mi.integer()),
	untilDate: v.optional(mi.integer()),
	type: v.optional(v.nullable(v.string())),
	userId: v.optional(v.nullable(mi.misskeyId())),
	search: v.optional(v.nullable(v.string())),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private moderationLogEntityService: ModerationLogEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.moderationLogsRepository.createQueryBuilder('log'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			if (ps.type != null) {
				query.andWhere('log.type = :type', { type: ps.type });
			}

			if (ps.userId != null) {
				query.andWhere('log.userId = :userId', { userId: ps.userId });
			}

			if (ps.search != null) {
				const escapedSearch = sqlLikeEscape(ps.search);
				query.andWhere('log.info::text ILIKE :search', { search: `%${escapedSearch}%` });
			}

			const logs = await query.limit(ps.limit).getMany();

			return await this.moderationLogEntityService.packMany(logs);
		});
	}
}
