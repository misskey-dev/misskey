/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPair } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DataSource, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsedUsernamesRepository, UsersRepository } from '@/models/_.js';
import { MiUser } from '@/models/User.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { IdService } from '@/core/IdService.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiUsedUsername } from '@/models/UsedUsername.js';
import generateUserToken from '@/misc/generate-native-user-token.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import UsersChart from '@/core/chart/charts/users.js';
import { UtilityService } from '@/core/UtilityService.js';
import { MetaService } from '@/core/MetaService.js';

@Injectable()
export class SignupService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private idService: IdService,
		private metaService: MetaService,
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
		if (await this.usersRepository.exist({ where: { usernameLower: username.toLowerCase(), host: IsNull() } })) {
			throw new Error('DUPLICATED_USERNAME');
		}

		// Check deleted username duplication
		if (await this.usedUsernamesRepository.exist({ where: { username: username.toLowerCase() } })) {
			throw new Error('USED_USERNAME');
		}

		const isTheFirstUser = (await this.usersRepository.countBy({ host: IsNull() })) === 0;

		if (!opts.ignorePreservedUsernames && !isTheFirstUser) {
			const instance = await this.metaService.fetch(true);
			const isPreserved = instance.preservedUsernames.map(x => x.toLowerCase()).includes(username.toLowerCase());
			if (isPreserved) {
				throw new Error('USED_USERNAME');
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
	}
}

