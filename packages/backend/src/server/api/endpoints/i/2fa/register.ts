import bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import config from '@/config/index.js';
import define from '../../../define.js';
import { UserProfiles } from '@/models/index.js';

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
export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneOrFail(user.id);

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
	const dataUrl = await QRCode.toDataURL(speakeasy.otpauthURL({
		secret: secret.base32,
		encoding: 'base32',
		label: user.username,
		issuer: config.host,
	}));

	return {
		qr: dataUrl,
		secret: secret.base32,
		label: user.username,
		issuer: config.host,
	};
});
