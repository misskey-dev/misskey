import * as OTPAuth from 'otpauth';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { UserProfilesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
	},
	required: ['token'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = ps.token.replace(/\s/g, '');

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorTempSecret == null) {
				throw new Error('二段階認証の設定が開始されていません');
			}

			const delta = OTPAuth.TOTP.validate({
				secret: OTPAuth.Secret.fromBase32(profile.twoFactorTempSecret),
				digits: 6,
				token,
				window: 1,
			});

			if (delta === null) {
				throw new Error('not verified');
			}

			await this.userProfilesRepository.update(me.id, {
				twoFactorSecret: profile.twoFactorTempSecret,
				twoFactorEnabled: true,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.pack(me.id, me, {
				detail: true,
				includeSecrets: true,
			}));
		});
	}
}
