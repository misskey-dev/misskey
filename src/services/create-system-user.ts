import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import generateNativeUserToken from '../server/api/common/generate-native-user-token';
import { genRsaKeyPair } from '../misc/gen-key-pair';
import { User } from '../models/entities/user';
import { UserProfile } from '../models/entities/user-profile';
import { getConnection } from 'typeorm';
import { genId } from '../misc/gen-id';
import { UserKeypair } from '../models/entities/user-keypair';
import { UsedUsername } from '../models/entities/used-username';

export async function createSystemUser(username: string) {
	const password = uuid();

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(password, salt);

	// Generate secret
	const secret = generateNativeUserToken();

	const keyPair = await genRsaKeyPair(4096);

	let account!: User;

	// Start transaction
	await getConnection().transaction(async transactionalEntityManager => {
		account = await transactionalEntityManager.save(new User({
			id: genId(),
			createdAt: new Date(),
			username: username,
			usernameLower: username.toLowerCase(),
			host: null,
			token: secret,
			isAdmin: false,
			isLocked: true,
			isBot: true,
		}));

		await transactionalEntityManager.save(new UserKeypair({
			publicKey: keyPair.publicKey,
			privateKey: keyPair.privateKey,
			userId: account.id
		}));

		await transactionalEntityManager.save(new UserProfile({
			userId: account.id,
			autoAcceptFollowed: false,
			password: hash,
		}));

		await transactionalEntityManager.save(new UsedUsername({
			createdAt: new Date(),
			username: username.toLowerCase(),
		}));
	});

	return account;
}
