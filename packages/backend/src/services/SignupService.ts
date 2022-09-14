import { generateKeyPair } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { UsedUsernames } from '@/models/index.js';
import { Users } from '@/models/index.js';
import { Config } from '@/config/types.js';
import { User } from '@/models/entities/user.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { IdService } from '@/services/IdService.js';
import { toPunyNullable } from '@/misc/convert-host';
import { UserKeypair } from '@/models/entities/user-keypair';
import { UsedUsername } from '@/models/entities/used-username';
import UsersChart from './chart/charts/users';
import generateUserToken from './generate-native-user-token.js';

@Injectable()
export class SignupService {
	constructor(
		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('usedUsernamesRepository')
		private usedUsernamesRepository: typeof UsedUsernames,

		private idService: IdService,
		private usersChart: UsersChart,
	) {
	}

	public async signup(opts: {
		username: User['username'];
		password?: string | null;
		passwordHash?: UserProfile['password'] | null;
		host?: string | null;
	}) {
		const { username, password, passwordHash, host } = opts;
		let hash = passwordHash;
	
		// Validate username
		if (!Users.validateLocalUsername(username)) {
			throw new Error('INVALID_USERNAME');
		}
	
		if (password != null && passwordHash == null) {
			// Validate password
			if (!Users.validatePassword(password)) {
				throw new Error('INVALID_PASSWORD');
			}
	
			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			hash = await bcrypt.hash(password, salt);
		}
	
		// Generate secret
		const secret = generateUserToken();
	
		// Check username duplication
		if (await Users.findOneBy({ usernameLower: username.toLowerCase(), host: IsNull() })) {
			throw new Error('DUPLICATED_USERNAME');
		}
	
		// Check deleted username duplication
		if (await this.usedUsernamesRepository.findOneBy({ username: username.toLowerCase() })) {
			throw new Error('USED_USERNAME');
		}
	
		const keyPair = await new Promise<string[]>((res, rej) =>
			generateKeyPair('rsa', {
				modulusLength: 4096,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
					cipher: undefined,
					passphrase: undefined,
				},
			} as any, (err, publicKey, privateKey) =>
				err ? rej(err) : res([publicKey, privateKey]),
			));
	
		let account!: User;
	
		// Start transaction
		await this.db.transaction(async transactionalEntityManager => {
			const exist = await transactionalEntityManager.findOneBy(User, {
				usernameLower: username.toLowerCase(),
				host: IsNull(),
			});
	
			if (exist) throw new Error(' the username is already used');
	
			account = await transactionalEntityManager.save(new User({
				id: this.idService.genId(),
				createdAt: new Date(),
				username: username,
				usernameLower: username.toLowerCase(),
				host: toPunyNullable(host),
				token: secret,
				isAdmin: (await Users.countBy({
					host: IsNull(),
				})) === 0,
			}));
	
			await transactionalEntityManager.save(new UserKeypair({
				publicKey: keyPair[0],
				privateKey: keyPair[1],
				userId: account.id,
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
	
		this.usersChart.update(account, true);
	
		return { account, secret };
	}
}

