import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import signin from '../common/signin';
import config from '@/config/index';
import { Users, Signins, UserProfiles, UserSecurityKeys, AttestationChallenges } from '@/models/index';
import { ILocalUser } from '@/models/entities/user';
import { genId } from '@/misc/gen-id';
import { verifyLogin, hash } from '../2fa';
import { randomBytes } from 'crypto';

export default async (ctx: Koa.Context) => {
	ctx.set('Access-Control-Allow-Origin', config.url);
	ctx.set('Access-Control-Allow-Credentials', 'true');

	const body = ctx.request.body as any;
	const username = body['username'];
	const password = body['password'];
	const token = body['token'];

	function error(status: number, error: { id: string }) {
		ctx.status = status;
		ctx.body = { error };
	}

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
		host: null,
	}) as ILocalUser;

	if (user == null) {
		error(404, {
			id: '6cc579cc-885d-43d8-95c2-b8c7fc963280',
		});
		return;
	}

	if (user.isSuspended) {
		error(403, {
			id: 'e03a5f46-d309-4865-9b69-56282d94e1eb',
		});
		return;
	}

	const profile = await UserProfiles.findOneOrFail(user.id);

	// Compare password
	const same = await bcrypt.compare(password, profile.password!);

	async function fail(status?: number, failure?: { id: string }) {
		// Append signin history
		await Signins.insert({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			ip: ctx.ip,
			headers: ctx.headers,
			success: false,
		});

		error(status || 500, failure || { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
	}

	if (!profile.twoFactorEnabled) {
		if (same) {
			signin(ctx, user);
			return;
		} else {
			await fail(403, {
				id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
			});
			return;
		}
	}

	if (token) {
		if (!same) {
			await fail(403, {
				id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
			});
			return;
		}

		const verified = (speakeasy as any).totp.verify({
			secret: profile.twoFactorSecret,
			encoding: 'base32',
			token: token,
			window: 2,
		});

		if (verified) {
			signin(ctx, user);
			return;
		} else {
			await fail(403, {
				id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f',
			});
			return;
		}
	} else if (body.credentialId) {
		if (!same && !profile.usePasswordLessLogin) {
			await fail(403, {
				id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
			});
			return;
		}

		const clientDataJSON = Buffer.from(body.clientDataJSON, 'hex');
		const clientData = JSON.parse(clientDataJSON.toString('utf-8'));
		const challenge = await AttestationChallenges.findOne({
			userId: user.id,
			id: body.challengeId,
			registrationChallenge: false,
			challenge: hash(clientData.challenge).toString('hex'),
		});

		if (!challenge) {
			await fail(403, {
				id: '2715a88a-2125-4013-932f-aa6fe72792da',
			});
			return;
		}

		await AttestationChallenges.delete({
			userId: user.id,
			id: body.challengeId,
		});

		if (new Date().getTime() - challenge.createdAt.getTime() >= 5 * 60 * 1000) {
			await fail(403, {
				id: '2715a88a-2125-4013-932f-aa6fe72792da',
			});
			return;
		}

		const securityKey = await UserSecurityKeys.findOne({
			id: Buffer.from(
				body.credentialId
					.replace(/-/g, '+')
					.replace(/_/g, '/'),
					'base64'
			).toString('hex'),
		});

		if (!securityKey) {
			await fail(403, {
				id: '66269679-aeaf-4474-862b-eb761197e046',
			});
			return;
		}

		const isValid = verifyLogin({
			publicKey: Buffer.from(securityKey.publicKey, 'hex'),
			authenticatorData: Buffer.from(body.authenticatorData, 'hex'),
			clientDataJSON,
			clientData,
			signature: Buffer.from(body.signature, 'hex'),
			challenge: challenge.challenge,
		});

		if (isValid) {
			signin(ctx, user);
			return;
		} else {
			await fail(403, {
				id: '93b86c4b-72f9-40eb-9815-798928603d1e',
			});
			return;
		}
	} else {
		if (!same && !profile.usePasswordLessLogin) {
			await fail(403, {
				id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
			});
			return;
		}

		const keys = await UserSecurityKeys.find({
			userId: user.id,
		});

		if (keys.length === 0) {
			await fail(403, {
				id: 'f27fd449-9af4-4841-9249-1f989b9fa4a4',
			});
			return;
		}

		// 32 byte challenge
		const challenge = randomBytes(32).toString('base64')
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');

		const challengeId = genId();

		await AttestationChallenges.insert({
			userId: user.id,
			id: challengeId,
			challenge: hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
			createdAt: new Date(),
			registrationChallenge: false,
		});

		ctx.body = {
			challenge,
			challengeId,
			securityKeys: keys.map(key => ({
				id: key.id,
			})),
		};
		ctx.status = 200;
		return;
	}
	// never get here
};
