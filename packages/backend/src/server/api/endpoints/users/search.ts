/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, UserProfilesRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for users.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		offset: { type: 'integer', default: 0 },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		origin: { type: 'string', enum: ['local', 'remote', 'combined'], default: 'combined' },
		detail: { type: 'boolean', default: true },
	},
	required: ['query'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const activeThreshold = new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)); // 30日

			ps.query = ps.query.trim();
			const isUsername = ps.query.startsWith('@');

			let users: MiUser[] = [];

			if (isUsername) {
				const usernameQuery = this.usersRepository.createQueryBuilder('user')
					.where('user.usernameLower LIKE :username', { username: sqlLikeEscape(ps.query.replace('@', '').toLowerCase()) + '%' })
					.andWhere(new Brackets(qb => {
						qb
							.where('user.updatedAt IS NULL')
							.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
					}))
					.andWhere('user.isSuspended = FALSE');

				if (ps.origin === 'local') {
					usernameQuery.andWhere('user.host IS NULL');
				} else if (ps.origin === 'remote') {
					usernameQuery.andWhere('user.host IS NOT NULL');
				}

				users = await usernameQuery
					.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
					.limit(ps.limit)
					.offset(ps.offset)
					.getMany();
			} else {
				const nameQuery = this.usersRepository.createQueryBuilder('user')
					.where(new Brackets(qb => {
						qb.where('user.name ILIKE :query', { query: '%' + sqlLikeEscape(ps.query) + '%' });

						// Also search username if it qualifies as username
						if (this.userEntityService.validateLocalUsername(ps.query)) {
							qb.orWhere('user.usernameLower LIKE :username', { username: '%' + sqlLikeEscape(ps.query.toLowerCase()) + '%' });
						}
					}))
					.andWhere(new Brackets(qb => {
						qb
							.where('user.updatedAt IS NULL')
							.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
					}))
					.andWhere('user.isSuspended = FALSE');

				if (ps.origin === 'local') {
					nameQuery.andWhere('user.host IS NULL');
				} else if (ps.origin === 'remote') {
					nameQuery.andWhere('user.host IS NOT NULL');
				}

				users = await nameQuery
					.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
					.limit(ps.limit)
					.offset(ps.offset)
					.getMany();

				if (users.length < ps.limit) {
					const profQuery = this.userProfilesRepository.createQueryBuilder('prof')
						.select('prof.userId')
						.where('prof.description ILIKE :query', { query: '%' + sqlLikeEscape(ps.query) + '%' });

					if (ps.origin === 'local') {
						profQuery.andWhere('prof.userHost IS NULL');
					} else if (ps.origin === 'remote') {
						profQuery.andWhere('prof.userHost IS NOT NULL');
					}

					const query = this.usersRepository.createQueryBuilder('user')
						.where(`user.id IN (${ profQuery.getQuery() })`)
						.andWhere(new Brackets(qb => {
							qb
								.where('user.updatedAt IS NULL')
								.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
						}))
						.andWhere('user.isSuspended = FALSE')
						.setParameters(profQuery.getParameters());

					users = users.concat(await query
						.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
						.limit(ps.limit)
						.offset(ps.offset)
						.getMany(),
					);
				}
			}

			return await this.userEntityService.packMany(users, me, { detail: ps.detail });
		});
	}
}
