import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import define from '../../define';
import * as nodemailer from 'nodemailer';
import fetchMeta from '../../../../misc/fetch-meta';
import rndstr from 'rndstr';
import config from '../../../../config';
const ms = require('ms');
import * as bcrypt from 'bcryptjs';
import { error } from '../../../../prelude/promise';

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
			validator: $.str.optional.nullable
		},
	}
};

export default define(meta, (ps, user) => bcrypt.compare(ps.password, user.password)
	.then(x =>
		!x ? error('incorrect password') :
		User.update(user._id, {
			$set: {
				email: ps.email,
				emailVerified: false,
				emailVerifyCode: null
			}
		}))
	.then(() => pack(user._id, user, {
			detail: true,
			includeSecrets: true
		}))
	.then(x => (publishMainStream(user._id, 'meUpdated', x), (ps.email || fetchMeta()
		.then(async x => {
			const emailVerifyCode = rndstr('a-z0-9', 16);
			await User.update(user._id, {
				$set: { emailVerifyCode }
			});
			const enableAuth = !x.smtpUser && x.smtpUser.length;
			return nodemailer.createTransport({
				host: x.smtpHost,
				port: x.smtpPort,
				secure: x.smtpSecure,
				ignoreTLS: !enableAuth,
				auth: enableAuth ? {
					user: x.smtpUser,
					pass: x.smtpPass
				} : undefined
			}).sendMail({
				from: x.email,
				to: ps.email,
				subject: x.name,
				text: `To verify email, please click this link: ${config.url}/verify-email/${emailVerifyCode}`
			})
			.then(
				x => console.log('Message sent: %s', x.messageId),
				console.error);
		}), x))));
