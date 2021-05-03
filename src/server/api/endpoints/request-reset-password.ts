import $ from 'cafy';
import { publishMainStream } from '../../../services/stream';
import define from '../define';
import rndstr from 'rndstr';
import config from '@/config';
import * as ms from 'ms';
import { Users, UserProfiles, PasswordResetRequests } from '../../../models';
import { sendEmail } from '../../../services/send-email';
import { ApiError } from '../error';
import { genId } from '@/misc/gen-id';

export const meta = {
	requireCredential: false as const,

	limit: {
		duration: ms('1hour'),
		max: 3
	},

	params: {
		username: {
			validator: $.str
		},

		email: {
			validator: $.str
		},
	},

	errors: {

	}
};

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOneOrFail({
		email: ps.email,
		emailVerified: true
	});

	await Users.findOneOrFail({
		id: profile.userId,
		usernameLower: ps.username.toLowerCase(),
	});

	const token = rndstr('a-z0-9', 64);

	await PasswordResetRequests.insert({
		id: genId(),
		createdAt: new Date(),
		userId: profile.userId,
		token
	});

	const link = `${config.url}/reset-password/${token}`;

	sendEmail(ps.email, 'Password reset requested',
		`To reset password, please click this link:<br><a href="${link}">${link}</a>`,
		`To reset password, please click this link: ${link}`);
});
