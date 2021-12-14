import $ from 'cafy';
import { publishMainStream } from '@/services/stream';
import define from '../define';
import rndstr from 'rndstr';
import config from '@/config/index';
import ms from 'ms';
import { Users, UserProfiles, PasswordResetRequests } from '@/models/index';
import { sendEmail } from '@/services/send-email';
import { ApiError } from '../error';
import { genId } from '@/misc/gen-id';
import { IsNull } from 'typeorm';

export const meta = {
	requireCredential: false as const,

	limit: {
		duration: ms('1hour'),
		max: 3,
	},

	params: {
		username: {
			validator: $.str,
		},

		email: {
			validator: $.str,
		},
	},

	errors: {

	},
};

export default define(meta, async (ps) => {
	const user = await Users.findOne({
		usernameLower: ps.username.toLowerCase(),
		host: IsNull(),
	});

	// 合致するユーザーが登録されていなかったら無視
	if (user == null) {
		return;
	}

	const profile = await UserProfiles.findOneOrFail(user.id);

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
