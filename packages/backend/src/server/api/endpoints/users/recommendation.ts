/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,

	kind: 'read:account',

	description: 'Show users that the authenticated user might be interested to follow.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailed',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: [],
} as const;

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
			this.queryService.generateBlockedUserQuery(query, me);

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
