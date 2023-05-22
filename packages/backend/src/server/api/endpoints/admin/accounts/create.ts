import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/index.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { localUsernameSchema, passwordSchema } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/accounts/create'> {
	name = 'admin/accounts/create' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private signupService: SignupService,
	) {
		super(async (ps, _me) => {
			const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;
			const noUsers = (await this.usersRepository.countBy({
				host: IsNull(),
			})) === 0;
			if (!noUsers && !me?.isRoot) throw new Error('access denied');

			const { account, secret } = await this.signupService.signup({
				username: ps.username,
				password: ps.password,
				ignorePreservedUsernames: true,
			});

			const res = await this.userEntityService.pack<true, true>(account, account, {
				detail: true,
				includeSecrets: true,
			});

			return { ...res, token: secret };
		});
	}
}
