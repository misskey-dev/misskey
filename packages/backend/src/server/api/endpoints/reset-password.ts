import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { publishMainStream } from '@/services/stream.js';
import type { Users } from '@/models/index.js';
import { UserProfiles, PasswordResetRequests } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
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
	}
}
