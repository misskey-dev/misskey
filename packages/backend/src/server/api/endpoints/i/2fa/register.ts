import bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

export const meta = {
	requireCredential: true,

	secure: true,
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
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			// Generate user's secret key
			const secret = speakeasy.generateSecret({
				length: 32,
			});

			await this.userProfilesRepository.update(me.id, {
				twoFactorTempSecret: secret.base32,
			});

			// Get the data URL of the authenticator URL
			const url = speakeasy.otpauthURL({
				secret: secret.base32,
				encoding: 'base32',
				label: me.username,
				issuer: this.config.host,
			});
			const dataUrl = await QRCode.toDataURL(url);

			return {
				qr: dataUrl,
				url,
				secret: secret.base32,
				label: me.username,
				issuer: this.config.host,
			};
		});
	}
}
