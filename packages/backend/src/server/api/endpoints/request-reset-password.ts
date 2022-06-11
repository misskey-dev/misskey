import { publishMainStream } from '@/services/stream.js';
import define from '../define.js';
import rndstr from 'rndstr';
import config from '@/config/index.js';
import ms from 'ms';
import { Users, UserProfiles, PasswordResetRequests } from '@/models/index.js';
import { sendEmail } from '@/services/send-email.js';
import { ApiError } from '../error.js';
import { genId } from '@/misc/gen-id.js';
import { IsNull } from 'typeorm';

export const meta = {
	tags: ['reset password'],

	requireCredential: false,

	description: 'Request a users password to be reset.',

	limit: {
		duration: ms('1hour'),
		max: 3,
	},

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: { type: 'string' },
		email: { type: 'string' },
	},
	required: ['username', 'email'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const user = await Users.findOneBy({
		usernameLower: ps.username.toLowerCase(),
		host: IsNull(),
	});

	// 合致するユーザーが登録されていなかったら無視
	if (user == null) {
		return;
	}

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// 合致するメアドが登録されていなかったら無視
	if (profile.email !== ps.email) {
		return;
	}

	// メアドが認証されていなかったら無視
	if (!profile.emailVerified) {
		return;
	}

	const token = rndstr('a-z0-9', 64);

	await PasswordResetRequests.insert({
		id: genId(),
		createdAt: new Date(),
		userId: profile.userId,
		token,
	});

	const link = `${config.url}/reset-password/${token}`;

	sendEmail(ps.email, 'Password reset requested',
		`To reset password, please click this link:<br><a href="${link}">${link}</a>`,
		`To reset password, please click this link: ${link}`);
});
