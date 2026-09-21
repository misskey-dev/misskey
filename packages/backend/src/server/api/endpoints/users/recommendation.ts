/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { UsersRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedUserDetailedSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,

	kind: 'read:account',

	description: 'Show users that the authenticated user might be interested to follow.',

	res: v.array(packedUserDetailedSchema),
} as const;

export const paramDef = v.object({
	limit: mi.limit({ max: 100, def: 10 }),
	offset: v.optional(mi.integer(), 0),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.usersRepository.createQueryBuilder('user')
				.where('user.isLocked = FALSE')
				.andWhere('user.isExplorable = TRUE')
				.andWhere('user.host IS NULL')
				.andWhere('user.updatedAt >= :date', { date: new Date(Date.now() - ms('7days')) })
				.andWhere('user.id != :meId', { meId: me.id })
				.orderBy('user.followersCount', 'DESC');

			this.queryService.generateMutedUserQueryForUsers(query, me);
			this.queryService.generateBlockQueryForUsers(query, me);
			this.queryService.generateBlockedUserQueryForNotes(query, me);
			this.queryService.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });

			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });

			query
				.andWhere(`user.id NOT IN (${ followingQuery.getQuery() })`);

			query.setParameters(followingQuery.getParameters());

			const users = await query.limit(ps.limit).offset(ps.offset).getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
		});
	}
}
