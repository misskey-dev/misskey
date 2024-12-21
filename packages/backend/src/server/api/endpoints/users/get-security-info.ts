import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import bcrypt from 'bcryptjs';
import ms from 'ms';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	res: {
		type: 'object',
		properties: {
			twoFactorEnabled: { type: 'boolean' },
			usePasswordLessLogin: { type: 'boolean' },
			securityKeys: { type: 'boolean' },
		},
	},
	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		email: { type: 'string' },
		password: { type: 'string' },
	},
	required: ['email', 'password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOneBy({
				email: ps.email,
				emailVerified: true,
			});

			const passwordMatched = await bcrypt.compare(ps.password, profile?.password ?? '');
			if (!profile || !passwordMatched) {
				return {
					twoFactorEnabled: false,
					usePasswordLessLogin: false,
					securityKeys: false,
				};
			}

			return {
				twoFactorEnabled: profile.twoFactorEnabled,
				usePasswordLessLogin: profile.usePasswordLessLogin,
				securityKeys: profile.twoFactorEnabled
					? await this.userSecurityKeysRepository.countBy({ userId: profile.userId }).then(result => result >= 1)
					: false,
			};
		});
	}
}
