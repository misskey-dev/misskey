import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import * as nodemailer from 'nodemailer';
import fetchMeta from '../../../../misc/fetch-meta';
import rndstr from 'rndstr';
import config from '../../../../config';
import * as ms from 'ms';
import * as bcrypt from 'bcryptjs';
import { apiLogger } from '../../logger';

export const meta = {
	requireCredential: true,

	secure: true,

	limit: {
		duration: ms('1hour'),
		max: 3
	},

	params: {
		password: {
			validator: $.str
		},

		email: {
			validator: $.optional.nullable.str
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

	if (!same) {
		return rej('incorrect password');
	}

	await User.update(user._id, {
		$set: {
			email: ps.email,
			emailVerified: false,
			emailVerifyCode: null
		}
	});

	// Serialize
	const iObj = await pack(user._id, user, {
		detail: true,
		includeSecrets: true
	});

	// Send response
	res(iObj);

	// Publish meUpdated event
	publishMainStream(user._id, 'meUpdated', iObj);

	if (ps.email != null) {
		const code = rndstr('a-z0-9', 16);

		await User.update(user._id, {
			$set: {
				emailVerifyCode: code
			}
		});

		const meta = await fetchMeta();

		const enableAuth = meta.smtpUser != null && meta.smtpUser !== '';

		const transporter = nodemailer.createTransport({
			host: meta.smtpHost,
			port: meta.smtpPort,
			secure: meta.smtpSecure,
			ignoreTLS: !enableAuth,
			auth: enableAuth ? {
				user: meta.smtpUser,
				pass: meta.smtpPass
			} : undefined
		});

		const link = `${config.url}/verify-email/${code}`;

		transporter.sendMail({
			from: meta.email,
			to: ps.email,
			subject: meta.name,
			text: `To verify email, please click this link: ${link}`
		}, (error, info) => {
			if (error) {
				apiLogger.error(error);
				return;
			}

			apiLogger.info('Message sent: %s', info.messageId);
		});
	}
}));
