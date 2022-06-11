import bcrypt from 'bcryptjs';
import { publishMainStream } from '@/services/stream.js';
import define from '../define.js';
import { Users, UserProfiles, PasswordResetRequests } from '@/models/index.js';
import { ApiError } from '../error.js';

export const meta = {
	tags: ['reset password'],

	requireCredential: false,

	description: 'Complete the password reset that was previously requested.',

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
		password: { type: 'string' },
	},
	required: ['token', 'password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const req = await PasswordResetRequests.findOneByOrFail({
		token: ps.token,
	});

	// 発行してから30分以上経過していたら無効
	if (Date.now() - req.createdAt.getTime() > 1000 * 60 * 30) {
		throw new Error(); // TODO
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(ps.password, salt);

	await UserProfiles.update(req.userId, {
		password: hash,
	});

	PasswordResetRequests.delete(req.id);
});
