/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { FollowingEntityService } from '@/core/entities/FollowingEntityService.js';
import type { FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { packedFollowingSchema } from '@/models/schema/following.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:following',
	description: 'List of following users',

	res: v.array(packedFollowingSchema),
} as const;

export const paramDef = v.object({
	notification: v.optional(v.boolean(), false),
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private followingEntityService: FollowingEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('following.followerId = :userId', { userId: me.id });

			if (ps.notification) {
				query.andWhere('following.notify IS NOT NULL');
			}

			query.innerJoinAndSelect('following.followee', 'followee');

			const followings = await query
				.limit(ps.limit)
				.getMany();

			return await this.followingEntityService.packMany(followings, me, { populateFollowee: true });
		});
	}
}
