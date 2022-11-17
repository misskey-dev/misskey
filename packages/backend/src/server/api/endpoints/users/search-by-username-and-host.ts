import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, FollowingsRepository } from '@/models/index.js';
import { USER_ACTIVE_THRESHOLD } from '@/const.js';
import type { User } from '@/models/entities/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for a user by username and/or host.',

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
		username: { type: 'string', nullable: true },
		host: { type: 'string', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		detail: { type: 'boolean', default: true },
	},
	anyOf: [
		{ required: ['username'] },
		{ required: ['host'] },
	],
} as const;

// TODO: avatar,bannerをJOINしたいけどエラーになる

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const activeThreshold = new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)); // 30日

			if (ps.host) {
				const q = this.usersRepository.createQueryBuilder('user')
					.where('user.isSuspended = FALSE')
					.andWhere('user.host LIKE :host', { host: ps.host.toLowerCase() + '%' });

				if (ps.username) {
					q.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' });
				}

				q.andWhere('user.updatedAt IS NOT NULL');
				q.orderBy('user.updatedAt', 'DESC');

				const users = await q.take(ps.limit).getMany();

				return await this.userEntityService.packMany(users, me, { detail: ps.detail });
			} else if (ps.username) {
				let users: User[] = [];

				if (me) {
					const followingQuery = this.followingsRepository.createQueryBuilder('following')
						.select('following.followeeId')
						.where('following.followerId = :followerId', { followerId: me.id });

					const query = this.usersRepository.createQueryBuilder('user')
						.where(`user.id IN (${ followingQuery.getQuery() })`)
						.andWhere('user.id != :meId', { meId: me.id })
						.andWhere('user.isSuspended = FALSE')
						.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' })
						.andWhere(new Brackets(qb => { qb
							.where('user.updatedAt IS NULL')
							.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
						}));

					query.setParameters(followingQuery.getParameters());

					users = await query
						.orderBy('user.usernameLower', 'ASC')
						.take(ps.limit)
						.getMany();

					if (users.length < ps.limit) {
						const otherQuery = await this.usersRepository.createQueryBuilder('user')
							.where(`user.id NOT IN (${ followingQuery.getQuery() })`)
							.andWhere('user.id != :meId', { meId: me.id })
							.andWhere('user.isSuspended = FALSE')
							.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' })
							.andWhere('user.updatedAt IS NOT NULL');

						otherQuery.setParameters(followingQuery.getParameters());

						const otherUsers = await otherQuery
							.orderBy('user.updatedAt', 'DESC')
							.take(ps.limit - users.length)
							.getMany();

						users = users.concat(otherUsers);
					}
				} else {
					users = await this.usersRepository.createQueryBuilder('user')
						.where('user.isSuspended = FALSE')
						.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' })
						.andWhere('user.updatedAt IS NOT NULL')
						.orderBy('user.updatedAt', 'DESC')
						.take(ps.limit - users.length)
						.getMany();
				}

				return await this.userEntityService.packMany(users, me, { detail: !!ps.detail });
			}

			return [];
		});
	}
}
