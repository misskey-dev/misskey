/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import type { FollowRequestsRepository } from '@/models/_.js';
import { FollowRequestEntityService } from '@/core/entities/FollowRequestEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'read:following',

	res: v.array(v.object({
		id: mi.idString(),
		follower: packedUserLiteSchema,
		followee: packedUserLiteSchema,
	})),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private followRequestEntityService: FollowRequestEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.followRequestsRepository.createQueryBuilder('request'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('request.followeeId = :meId', { meId: me.id });

			const requests = await query
				.limit(ps.limit)
				.getMany();

			return await this.followRequestEntityService.packMany(requests, me);
		});
	}
}
