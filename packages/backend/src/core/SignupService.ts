/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPair } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import * as Redis from 'ioredis';
import { DataSource, IsNull } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import generateUserToken from '@/misc/generate-native-user-token.js';
import type { UsedUsernamesRepository, UsersRepository } from '@/models/_.js';
import { MiUser } from '@/models/User.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiUsedUsername } from '@/models/UsedUsername.js';
import { IdService } from '@/core/IdService.js';
import { MetaService } from '@/core/MetaService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import UsersChart from '@/core/chart/charts/users.js';

@Injectable()
export class SignupService {
	public logger: Logger;

	constructor(
		@Inject(DI.db)
		private db: DataSource,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		private idService: IdService,
		private metaService: MetaService,
		private utilityService: UtilityService,
		private loggerService: LoggerService,
		private instanceActorService: InstanceActorService,
		private userEntityService: UserEntityService,
		private usersChart: UsersChart,
	) {
		this.logger = this.loggerService.getLogger('account:create');
	}

	@bindThis
	public async signup(opts: {
		username: MiUser['username'];
		password?: string | null;
		passwordHash?: MiUserProfile['password'] | null;
		host?: string | null;
		ignorePreservedUsernames?: boolean;
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
		if (await this.usersRepository.exists({ where: { usernameLower: username.toLowerCase(), host: IsNull() } })) {
			throw new Error('DUPLICATED_USERNAME');
		}

		// Check deleted username duplication
		if (await this.usedUsernamesRepository.exists({ where: { username: username.toLowerCase() } })) {
			throw new Error('USED_USERNAME');
		}

		const isTheFirstUser = !await this.instanceActorService.realLocalUsersPresent();

		if (!opts.ignorePreservedUsernames && !isTheFirstUser) {
			const instance = await this.metaService.fetch(true);
			const isPreserved = instance.preservedUsernames.map(x => x.toLowerCase()).includes(username.toLowerCase());
			if (isPreserved) {
				throw new Error('USED_USERNAME');
			}
		}

		const keyPair = await new Promise<string[]>((res, rej) =>
			generateKeyPair('rsa', {
				modulusLength: 3072,
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
			}, (err, publicKey, privateKey) =>
				err ? rej(err) : res([publicKey, privateKey]),
			));

		// 5分間のロックを取得
		const lock = await this.redisClient.set(`account:create:lock:${username.toLowerCase()}`, Date.now(), 'EX', 60 * 5, 'NX');
		if (lock === null) {
			throw new Error('ALREADY_IN_PROGRESS');
		}

		try {
			let account!: MiUser;

			// Start transaction
			await this.db.transaction(async transactionalEntityManager => {
				const exist = await transactionalEntityManager.findOneBy(MiUser, {
					usernameLower: username.toLowerCase(),
					host: IsNull(),
				});

				if (exist) throw new Error(' the username is already used');

				account = await transactionalEntityManager.save(new MiUser({
					id: this.idService.gen(),
					username: username,
					usernameLower: username.toLowerCase(),
					host: this.utilityService.toPunyNullable(host),
					token: secret,
					isRoot: isTheFirstUser,
				}));

				await transactionalEntityManager.save(new MiUserKeypair({
					publicKey: keyPair[0],
					privateKey: keyPair[1],
					userId: account.id,
				}));

				await transactionalEntityManager.save(new MiUserProfile({
					userId: account.id,
					autoAcceptFollowed: true,
					password: hash,
				}));

				await transactionalEntityManager.save(new MiUsedUsername({
					createdAt: new Date(),
					username: username.toLowerCase(),
				}));
			});

			this.usersChart.update(account, true);

			return { account, secret };
		} catch (err) {
			this.logger.error(`Failed to create account ${username}`, { error: err });
			throw err;
		} finally {
			// 成功・失敗に関わらずロックを解除
			await this.redisClient.unlink(`account:create:lock:${username.toLowerCase()}`);
		}
	}
}

