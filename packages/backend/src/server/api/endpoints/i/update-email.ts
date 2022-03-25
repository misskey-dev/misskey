import { publishMainStream } from '@/services/stream.js';
import define from '../../define.js';
import rndstr from 'rndstr';
import config from '@/config/index.js';
import ms from 'ms';
import bcrypt from 'bcryptjs';
import { Users, UserProfiles } from '@/models/index.js';
import { sendEmail } from '@/services/send-email.js';
import { ApiError } from '../../error.js';
import { validateEmailForAccount } from '@/services/validate-email-for-account.js';

export const meta = {
	requireCredential: true,

	secure: true,

	limit: {
		duration: ms('1hour'),
		max: 3,
	},

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: 'e54c1d7e-e7d6-4103-86b6-0a95069b4ad3',
		},

		unavailable: {
			message: 'Unavailable email address.',
			code: 'UNAVAILABLE',
			id: 'a2defefb-f220-8849-0af6-17f816099323',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		email: { type: 'string', nullable: true },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare password
	const same = await bcrypt.compare(ps.password, profile.password!);

	if (!same) {
		throw new ApiError(meta.errors.incorrectPassword);
	}

	if (ps.email != null) {
		const available = await validateEmailForAccount(ps.email);
		if (!available) {
			throw new ApiError(meta.errors.unavailable);
		}
	}

	await UserProfiles.update(user.id, {
		email: ps.email,
		emailVerified: false,
		emailVerifyCode: null,
	});

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	// Publish meUpdated event
	publishMainStream(user.id, 'meUpdated', iObj);

	if (ps.email != null) {
		const code = rndstr('a-z0-9', 16);

		await UserProfiles.update(user.id, {
			emailVerifyCode: code,
		});

		const link = `${config.url}/verify-email/${code}`;

		sendEmail(ps.email, 'Email verification',
			`To verify email, please click this link:<br><a href="${link}">${link}</a>`,
			`To verify email, please click this link: ${link}`);
	}

	return iObj;
});
