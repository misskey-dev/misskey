import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import config from '../../../config';
import { Users, UserProfiles, UserSecurityKeys, AttestationChallenges } from '../../../models';
import { ILocalUser } from '../../../models/entities/user';
import { genId } from '../../../misc/gen-id';
import { ensure } from '../../../prelude/ensure';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { hash } from '../2fa';

const randomBytes = promisify(crypto.randomBytes);

export default async (ctx: Koa.BaseContext) => {
	ctx.set('Access-Control-Allow-Origin', config.url);
	ctx.set('Access-Control-Allow-Credentials', 'true');

	const body = ctx.request.body as any;
	const username = body['username'];
	const password = body['password'];

	if (typeof username != 'string') {
		ctx.status = 400;
		return;
	}

	if (typeof password != 'string') {
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

	const profile = await UserProfiles.findOne(user.id).then(ensure);

	// Compare password
	const same = await bcrypt.compare(password, profile.password!);

	if (same) {
		const keys = await UserSecurityKeys.find({
			userId: user.id
		});

		if(keys.length) {
		        // 32 byte challenge
		        const entropy = await randomBytes(32);
		        const challenge = entropy.toString('base64')
			      .replace(/=/g, "")
		              .replace(/\+/g, "-")
		              .replace(/\//g, "_");

			const challengeId = genId();

			await AttestationChallenges.save({
				userId: user.id,
				challengeId,
				challenge: hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
				createdAt: new Date(),
				registrationChallenge: false
			});

		        ctx.body = {
				challenge,
			 	challengeId,
				securityKeys: keys.map(key => ({
		 			id: key.credentialId
				}))
			};
			return;
		} else {
         		ctx.throw(403, {
         			error: 'no keys found'
         		});
			return;
		}
	} else {
		ctx.throw(403, {
			error: 'incorrect password'
		});
		return;
	}
};
