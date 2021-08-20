import * as bcrypt from 'bcryptjs';
import { generateKeyPair } from 'crypto';
import generateUserToken from './generate-native-user-token';
import { User } from '@/models/entities/user';
import { Users, UsedUsernames } from '@/models/index';
import { UserProfile } from '@/models/entities/user-profile';
import { getConnection } from 'typeorm';
import { genId } from '@/misc/gen-id';
import { toPunyNullable } from '@/misc/convert-host';
import { UserKeypair } from '@/models/entities/user-keypair';
import { usersChart } from '@/services/chart/index';
import { UsedUsername } from '@/models/entities/used-username';

export async function signup(username: User['username'], password: UserProfile['password'], host: string | null = null) {
	// Validate username
	if (!Users.validateLocalUsername.ok(username)) {
		throw new Error('INVALID_USERNAME');
	}

	// Validate password
	if (!Users.validatePassword.ok(password)) {
		throw new Error('INVALID_PASSWORD');
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(password, salt);

	// Generate secret
	const secret = generateUserToken();

	// Check username duplication
	if (await Users.findOne({ usernameLower: username.toLowerCase(), host: null })) {
		throw new Error('DUPLICATED_USERNAME');
	}

	// Check deleted username duplication
	if (await UsedUsernames.findOne({ username: username.toLowerCase() })) {
		throw new Error('USED_USERNAME');
	}

	const keyPair = await new Promise<string[]>((res, rej) =>
		generateKeyPair('rsa', {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: 'spki',
				format: 'pem'
			},
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem',
				cipher: undefined,
				passphrase: undefined
			}
		} as any, (err, publicKey, privateKey) =>
			err ? rej(err) : res([publicKey, privateKey])
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
			isAdmin: (await Users.count({
				host: null,
			})) === 0,
		}));

		await transactionalEntityManager.save(new UserKeypair({
			publicKey: keyPair[0],
			privateKey: keyPair[1],
			userId: account.id
		}));

		await transactionalEntityManager.save(new UserProfile({
			userId: account.id,
			autoAcceptFollowed: true,
			password: hash,
		}));

		await transactionalEntityManager.save(new UsedUsername({
			createdAt: new Date(),
			username: username.toLowerCase(),
		}));
	});

	usersChart.update(account, true);

	return { account, secret };
}
