import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'hashtags/users'> {
	name = 'hashtags/users' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		
		private userEntityService: UserEntityService,
	) {
		super(async (ps, me) => {
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
				case '+createdAt': query.orderBy('user.createdAt', 'DESC'); break;
				case '-createdAt': query.orderBy('user.createdAt', 'ASC'); break;
				case '+updatedAt': query.orderBy('user.updatedAt', 'DESC'); break;
				case '-updatedAt': query.orderBy('user.updatedAt', 'ASC'); break;
			}

			const users = await query.take(ps.limit).getMany();

			return await this.userEntityService.packMany(users, me, { detail: true });
		});
	}
}
