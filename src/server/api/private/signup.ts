import * as Koa from 'koa';
import * as bcrypt from 'bcryptjs';
import { generateKeyPair } from 'crypto';
import generateUserToken from '../common/generate-native-user-token';
import config from '../../../config';
import { fetchMeta } from '../../../misc/fetch-meta';
import * as recaptcha from 'recaptcha-promise';
import { Users, Signins, RegistrationTickets, UsedUsernames } from '../../../models';
import { genId } from '../../../misc/gen-id';
import { usersChart } from '../../../services/chart';
import { User } from '../../../models/entities/user';
import { UserKeypair } from '../../../models/entities/user-keypair';
import { toPunyNullable } from '../../../misc/convert-host';
import { UserProfile } from '../../../models/entities/user-profile';
import { getConnection } from 'typeorm';
import { UsedUsername } from '../../../models/entities/used-username';

export default async (ctx: Koa.BaseContext) => {
	const body = ctx.request.body as any;

	const instance = await fetchMeta(true);

	// Verify recaptcha
	// ただしテスト時はこの機構は障害となるため無効にする
	if (process.env.NODE_ENV !== 'test' && instance.enableRecaptcha && instance.recaptchaSecretKey) {
		recaptcha.init({
			secret_key: instance.recaptchaSecretKey
		});

		const success = await recaptcha(body['g-recaptcha-response']);

		if (!success) {
			ctx.throw(400, 'recaptcha-failed');
			return;
		}
	}

	const username = body['username'];
	const password = body['password'];
	const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] || null) : null;
	const invitationCode = body['invitationCode'];

	if (instance && instance.disableRegistration) {
		if (invitationCode == null || typeof invitationCode != 'string') {
			ctx.status = 400;
			return;
		}

		const ticket = await RegistrationTickets.findOne({
			code: invitationCode
		});

		if (ticket == null) {
			ctx.status = 400;
			return;
		}

		RegistrationTickets.delete(ticket.id);
	}

	// Validate username
	if (!Users.validateLocalUsername.ok(username)) {
		ctx.status = 400;
		return;
	}

	// Validate password
	if (!Users.validatePassword.ok(password)) {
		ctx.status = 400;
		return;
	}

	const usersCount = await Users.count({});

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(password, salt);

	// Generate secret
	const secret = generateUserToken();

	// Check username duplication
	if (await Users.findOne({ usernameLower: username.toLowerCase(), host: null })) {
		ctx.status = 400;
		return;
	}

	// Check deleted username duplication
	if (await UsedUsernames.findOne({ username: username.toLowerCase() })) {
		ctx.status = 400;
		return;
	}

	const keyPair = await new Promise<string[]>((s, j) =>
		generateKeyPair('rsa', {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: 'pkcs1',
				format: 'pem'
			},
			privateKeyEncoding: {
				type: 'pkcs1',
				format: 'pem',
				cipher: undefined,
				passphrase: undefined
			}
		} as any, (e, publicKey, privateKey) =>
			e ? j(e) : s([publicKey, privateKey])
		));

	let account!: User;

	// Start transaction
	await getConnection().transaction(async transactionalEntityManager => {
		const exist = await transactionalEntityManager.findOne(User, {
			usernameLower: username.toLowerCase(),
			host: null
		});

		if (exist) throw new Error(' the username is already used');

		account = await transactionalEntityManager.save(new User({
			id: genId(),
			createdAt: new Date(),
			username: username,
			usernameLower: username.toLowerCase(),
			host: toPunyNullable(host),
			token: secret,
			isAdmin: config.autoAdmin && usersCount === 0,
		}));

		await transactionalEntityManager.save(new UserKeypair({
			publicKey: keyPair[0],
			privateKey: keyPair[1],
			userId: account.id
		}));

		await transactionalEntityManager.save(new UserProfile({
			userId: account.id,
			autoAcceptFollowed: true,
			autoWatch: false,
			password: hash,
		}));

		await transactionalEntityManager.save(new UsedUsername({
			createdAt: new Date(),
			username: username.toLowerCase(),
		}));
	});

	usersChart.update(account, true);

	// Append signin history
	await Signins.save({
		id: genId(),
		createdAt: new Date(),
		userId: account.id,
		ip: ctx.ip,
		headers: ctx.headers,
		success: true
	});

	const res = await Users.pack(account, account, {
		detail: true,
		includeSecrets: true
	});

	(res as any).token = secret;

	ctx.body = res;
};
