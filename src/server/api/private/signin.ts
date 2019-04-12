import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { publishMainStream } from '../../../services/stream';
import signin from '../common/signin';
import config from '../../../config';
import { Users, Signins, UserProfiles } from '../../../models';
import { ILocalUser } from '../../../models/entities/user';
import { genId } from '../../../misc/gen-id';
import { ensure } from '../../../misc/ensure';

export default async (ctx: Koa.BaseContext) => {
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
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	}) as ILocalUser;

	if (user == null) {
		ctx.throw(404, {
			error: 'user not found'
		});
		return;
	}

	const profile = await UserProfiles.findOne({ userId: user.id }).then(ensure);

	// Compare password
	const same = await bcrypt.compare(password, profile.password!);

	if (same) {
		if (profile.twoFactorEnabled) {
			const verified = (speakeasy as any).totp.verify({
				secret: profile.twoFactorSecret,
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
	const record = await Signins.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		ip: ctx.ip,
		headers: ctx.headers,
		success: same
	});

	// Publish signin event
	publishMainStream(user.id, 'signin', await Signins.pack(record));
};
