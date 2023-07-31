/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull, DataSource } from 'typeorm';
import { genRsaKeyPair } from '@/misc/gen-key-pair.js';
import { User } from '@/models/entities/User.js';
import { UserProfile } from '@/models/entities/UserProfile.js';
import { IdService } from '@/core/IdService.js';
import { UserKeypair } from '@/models/entities/UserKeypair.js';
import { UsedUsername } from '@/models/entities/UsedUsername.js';
import { DI } from '@/di-symbols.js';
import generateNativeUserToken from '@/misc/generate-native-user-token.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class CreateSystemUserService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private idService: IdService,
	) {
	}

	@bindThis
	public async createSystemUser(username: string): Promise<User> {
		const password = randomUUID();

		// Generate hash of password
		const salt = await bcrypt.genSalt(8);
		const hash = await bcrypt.hash(password, salt);

		// Generate secret
		const secret = generateNativeUserToken();

		const keyPair = await genRsaKeyPair();

		let account!: User;

		// Start transaction
		await this.db.transaction(async transactionalEntityManager => {
			const exist = await transactionalEntityManager.findOneBy(User, {
				usernameLower: username.toLowerCase(),
				host: IsNull(),
			});

			if (exist) throw new Error('the user is already exists');

			account = await transactionalEntityManager.insert(User, {
				id: this.idService.genId(),
				createdAt: new Date(),
				username: username,
				usernameLower: username.toLowerCase(),
				host: null,
				token: secret,
				isRoot: false,
				isLocked: true,
				isExplorable: false,
				isBot: true,
			}).then(x => transactionalEntityManager.findOneByOrFail(User, x.identifiers[0]));

			await transactionalEntityManager.insert(UserKeypair, {
				publicKey: keyPair.publicKey,
				privateKey: keyPair.privateKey,
				userId: account.id,
			});

			await transactionalEntityManager.insert(UserProfile, {
				userId: account.id,
				autoAcceptFollowed: false,
				password: hash,
			});

			await transactionalEntityManager.insert(UsedUsername, {
				createdAt: new Date(),
				username: username.toLowerCase(),
			});
		});

		return account;
	}
}
