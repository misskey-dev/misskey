/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
	) {
	}

	@bindThis
	public async updateLastActiveDate(user: MiUser): Promise<void> {
		if (user.isHibernated) {
			const result = await this.usersRepository.createQueryBuilder().update()
				.set({
					lastActiveDate: new Date(),
				})
				.where('id = :id', { id: user.id })
				.returning('*')
				.execute()
				.then((response) => {
					return response.raw[0];
				});
			const wokeUp = result.isHibernated;
			if (wokeUp) {
				this.usersRepository.update(user.id, {
					isHibernated: false,
				});
				this.followingsRepository.update({
					followerId: user.id,
				}, {
					isFollowerHibernated: false,
				});
			}
		} else {
			this.usersRepository.update(user.id, {
				lastActiveDate: new Date(),
			});
		}
	}
}
