/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: false,

	tags: ['hashtags', 'users'],

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
		tag: { type: 'string' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'] },
		state: { type: 'string', enum: ['all', 'alive'], default: 'all' },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
	},
	required: ['tag', 'sort'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.usersRepository.createQueryBuilder('user')
				.where(':tag = ANY(user.tags)', { tag: normalizeForSearch(ps.tag) })
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

			const users = await query.limit(ps.limit).getMany();

			return await this.userEntityService.packMany(users, me, { detail: true });
		});
	}
}
