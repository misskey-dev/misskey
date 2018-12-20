import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import User, { ILocalUser } from '../../../models/user';
import Signin, { pack } from '../../../models/signin';
import { publishMainStream } from '../../../stream';
import signin from '../common/signin';
import config from '../../../config';

export default async (ctx: Koa.Context) => {
	ctx.set('Access-Control-Allow-Origin', config.url);
	ctx.set('Access-Control-Allow-Credentials', 'true');

	const body = ctx.request.body as any;
	const username = body['username'];
	const password = body['password'];
	const token = body['token'];

	if (typeof username != 'string') {
		ctx.status = 400;
		return;
	}

	if (typeof password != 'string') {
		ctx.status = 400;
		return;
	}

	if (token != null && typeof token != 'string') {
		ctx.status = 400;
		return;
	}

	// Fetch user
	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	}, {
			fields: {
				data: false,
				profile: false
			}
		}) as ILocalUser;

	if (user === null) {
		ctx.throw(404, {
			error: 'user not found'
		});
		return;
	}

	// Compare password
	const same = await bcrypt.compare(password, user.password);

	if (same) {
		if (user.twoFactorEnabled) {
			const verified = (speakeasy as any).totp.verify({
				secret: user.twoFactorSecret,
				encoding: 'base32',
				token: token
			});

			if (verified) {
				signin(ctx, user);
			} else {
				ctx.throw(403, {
					error: 'invalid token'
				});
			}
		} else {
			signin(ctx, user);
		}
	} else {
		ctx.throw(403, {
			error: 'incorrect password'
		});
	}

	// Append signin history
	const record = await Signin.insert({
		createdAt: new Date(),
		userId: user._id,
		ip: ctx.ip,
		headers: ctx.headers,
		success: same
	});

	// Publish signin event
	publishMainStream(user._id, 'signin', await pack(record));
};
