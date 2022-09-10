import * as speakeasy from 'speakeasy';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserProfiles } from '@/models/index.js';

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
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	const token = ps.token.replace(/\s/g, '');

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (profile.twoFactorTempSecret == null) {
		throw new Error('二段階認証の設定が開始されていません');
	}

	const verified = (speakeasy as any).totp.verify({
		secret: profile.twoFactorTempSecret,
		encoding: 'base32',
		token: token,
	});

	if (!verified) {
		throw new Error('not verified');
	}

	await UserProfiles.update(user.id, {
		twoFactorSecret: profile.twoFactorTempSecret,
		twoFactorEnabled: true,
	});
});
