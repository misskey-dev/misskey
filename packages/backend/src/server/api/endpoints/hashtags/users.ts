/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import { safeForSql } from "@/misc/safe-for-sql.js";
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedUserDetailedSchema } from '@/models/schema/user.js';

export const meta = {
	requireCredential: false,

	tags: ['hashtags', 'users'],

	res: v.array(packedUserDetailedSchema),
} as const;

export const paramDef = v.object({
	tag: v.string(),
	limit: mi.limit({ max: 100, def: 10 }),
	offset: v.optional(mi.integer(), 0),
	sort: v.picklist(['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt']),
	state: v.optional(v.picklist(['all', 'alive']), 'all'),
	origin: v.optional(v.picklist(['combined', 'local', 'remote']), 'local'),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
			const query = this.usersRepository.createQueryBuilder('user')
				.where(':tag <@ user.tags', { tag: [normalizeForSearch(ps.tag)] })
				.andWhere('user.isSuspended = FALSE');

			const recent = new Date(Date.now() - (1000 * 60 * 60 * 24 * 5));

			if (ps.state === 'alive') {
				query.andWhere('user.updatedAt > :date', { date: recent });
			}

			if (ps.origin === 'local') {
				query.andWhere('user.host IS NULL');
			} else if (ps.origin === 'remote') {
				query.andWhere('user.host IS NOT NULL');
			}

			switch (ps.sort) {
				case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
				case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
				case '+createdAt': query.orderBy('user.id', 'DESC'); break;
				case '-createdAt': query.orderBy('user.id', 'ASC'); break;
				case '+updatedAt': query.orderBy('user.updatedAt', 'DESC'); break;
				case '-updatedAt': query.orderBy('user.updatedAt', 'ASC'); break;
			}

			const users = await query
				.limit(ps.limit)
				.offset(ps.offset)
				.getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
		});
	}
}
