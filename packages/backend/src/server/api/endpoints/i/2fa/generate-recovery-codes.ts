import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { UserProfilesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	requireCredential: true,

	secure: true,

	error: {
		twoFactorNotSetup: {
			message: '2fa is not set up.',
			code: 'NOT_SET_UP',
			id: '1f23a9d2-074c-4a57-23b7-eb538defa31f'
		}
	}
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async(ps, me) => {
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			if (!profile.twoFactorEnabled) {
				throw new ApiError(meta.error.twoFactorNotSetup);
			}

			const recoveryCodes: string[] = [];
			for (let i = 0; i < 8; i++) {
				//TODO
			}
			return ['12345678', 'abcdefgh', 'gfhiduawi', 'da2389ejh', 'qwertyui', '09876543', '23478567', 'zxcvbnmk'];
		});
	}
}
