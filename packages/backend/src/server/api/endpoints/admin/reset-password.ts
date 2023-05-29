import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import rndstr from 'rndstr';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, UserProfilesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/reset-password'> {
	name = 'admin/reset-password' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
	) {
		super(async (ps) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (user.isRoot) {
				throw new Error('cannot reset password of root');
			}

			const passwd = rndstr('a-zA-Z0-9', 8);

			// Generate hash of password
			const hash = bcrypt.hashSync(passwd);

			await this.userProfilesRepository.update({
				userId: user.id,
			}, {
				password: hash,
			});

			return {
				password: passwd,
			};
		});
	}
}
