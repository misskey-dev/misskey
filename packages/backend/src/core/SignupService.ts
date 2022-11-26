import { generateKeyPair } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsedUsernamesRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { User } from '@/models/entities/User.js';
import { UserProfile } from '@/models/entities/UserProfile.js';
import { IdService } from '@/core/IdService.js';
import { UserKeypair } from '@/models/entities/UserKeypair.js';
import { UsedUsername } from '@/models/entities/UsedUsername.js';
import generateUserToken from '@/misc/generate-native-user-token.js';
import UsersChart from './chart/charts/users.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { UtilityService } from './UtilityService.js';

@Injectable()
export class SignupService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
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
		if (!this.userEntityService.validateLocalUsername(username)) {
			throw new Error('INVALID_USERNAME');
		}
	
		if (password != null && passwordHash == null) {
			// Validate password
			if (!this.userEntityService.validatePassword(password)) {
				throw new Error('INVALID_PASSWORD');
			}
	
			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			hash = await bcrypt.hash(password, salt);
		}
	
		// Generate secret
		const secret = generateUserToken();
	
		// Check username duplication
		if (await this.usersRepository.findOneBy({ usernameLower: username.toLowerCase(), host: IsNull() })) {
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
				host: this.utilityService.toPunyNullable(host),
				token: secret,
				isAdmin: (await this.usersRepository.countBy({
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

