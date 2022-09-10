import bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Inject, Injectable } from '@nestjs/common';
import config from '@/config/index.js';
import { UserProfiles } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

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
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			// Generate user's secret key
			const secret = speakeasy.generateSecret({
				length: 32,
			});

			await UserProfiles.update(user.id, {
				twoFactorTempSecret: secret.base32,
			});

			// Get the data URL of the authenticator URL
			const url = speakeasy.otpauthURL({
				secret: secret.base32,
				encoding: 'base32',
				label: user.username,
				issuer: config.host,
			});
			const dataUrl = await QRCode.toDataURL(url);

			return {
				qr: dataUrl,
				url,
				secret: secret.base32,
				label: user.username,
				issuer: config.host,
			};
		});
	}
}
