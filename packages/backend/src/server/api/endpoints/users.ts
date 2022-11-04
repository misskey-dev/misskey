import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

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
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'] },
		state: { type: 'string', enum: ['all', 'admin', 'moderator', 'adminOrModerator', 'alive'], default: 'all' },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
		hostname: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'The local host is represented with `null`.',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.usersRepository.createQueryBuilder('user');
			query.where('user.isExplorable = TRUE');

			switch (ps.state) {
				case 'admin': query.andWhere('user.isAdmin = TRUE'); break;
				case 'moderator': query.andWhere('user.isModerator = TRUE'); break;
				case 'adminOrModerator': query.andWhere('user.isAdmin = TRUE OR user.isModerator = TRUE'); break;
				case 'alive': query.andWhere('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
			}

			switch (ps.origin) {
				case 'local': query.andWhere('user.host IS NULL'); break;
				case 'remote': query.andWhere('user.host IS NOT NULL'); break;
			}

			if (ps.hostname) {
				query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
			}

			switch (ps.sort) {
				case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
				case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
				case '+createdAt': query.orderBy('user.createdAt', 'DESC'); break;
				case '-createdAt': query.orderBy('user.createdAt', 'ASC'); break;
				case '+updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'DESC'); break;
				case '-updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'ASC'); break;
				default: query.orderBy('user.id', 'ASC'); break;
			}

			if (me) this.queryService.generateMutedUserQueryForUsers(query, me);
			if (me) this.queryService.generateBlockQueryForUsers(query, me);

			query.take(ps.limit);
			query.skip(ps.offset);

			const users = await query.getMany();

			return await this.userEntityService.packMany(users, me, { detail: true });
		});
	}
}
