/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPair } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiMeta, UsedUsernamesRepository, UsersRepository } from '@/models/_.js';
import { MiUser } from '@/models/User.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { IdService } from '@/core/IdService.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiUsedUsername } from '@/models/UsedUsername.js';
import generateUserToken from '@/misc/generate-native-user-token.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import UsersChart from '@/core/chart/charts/users.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserService } from '@/core/UserService.js';

@Injectable()
export class SignupService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		private utilityService: UtilityService,
		private userService: UserService,
		private userEntityService: UserEntityService,
		private idService: IdService,
		private instanceActorService: InstanceActorService,
		private usersChart: UsersChart,
	) {
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
			throw new IdentifiableError('be85f7f4-1dd3-4107-bce4-07cdb0cbb0c3', 'INVALID_USERNAME');
		}

		if (password != null && passwordHash == null) {
			// Validate password
			if (!this.userEntityService.validatePassword(password)) {
				throw new IdentifiableError('d5f4959c-a881-41e8-b755-718fbf161258', 'INVALID_PASSWORD');
			}

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			hash = await bcrypt.hash(password, salt);
		}

		// Generate secret
		const secret = generateUserToken();

		// Check username duplication
		if (await this.usersRepository.exists({ where: { usernameLower: username.toLowerCase(), host: IsNull() } })) {
			throw new IdentifiableError('d412327a-1bd7-4b70-a982-7eec000db8fc', 'DUPLICATED_USERNAME');
		}

		// Check deleted username duplication
		if (await this.usedUsernamesRepository.exists({ where: { username: username.toLowerCase() } })) {
			throw new IdentifiableError('dd5f52be-2c95-4c39-ba45-dc2d74b3dd81', 'USED_USERNAME');
		}

		const isTheFirstUser = !await this.instanceActorService.realLocalUsersPresent();

		if (!opts.ignorePreservedUsernames && !isTheFirstUser) {
			const isPreserved = this.meta.preservedUsernames.map(x => x.toLowerCase()).includes(username.toLowerCase());
			if (isPreserved) {
				throw new IdentifiableError('adad138b-9c63-41bf-931e-6b050fd3bb8d', 'DENIED_USERNAME');
			}
		}

		const keyPair = await new Promise<string[]>((res, rej) =>
			generateKeyPair('rsa', {
				modulusLength: 2048,
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

		let account!: MiUser;

		// Start transaction
		await this.db.transaction(async transactionalEntityManager => {
			const exist = await transactionalEntityManager.findOneBy(MiUser, {
				usernameLower: username.toLowerCase(),
				host: IsNull(),
			});

			if (exist) {
				throw new IdentifiableError('d412327a-1bd7-4b70-a982-7eec000db8fc', 'DUPLICATED_USERNAME');
			}

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
		this.userService.notifySystemWebhook(account, 'userCreated');

		return { account, secret };
	}
}

