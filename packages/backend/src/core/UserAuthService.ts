/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as OTPAuth from 'otpauth';
import { createHash } from 'node:crypto';
import { DI } from '@/di-symbols.js';
import type { MiUserProfile, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserAuthService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
	) {
	}

	@bindThis
	public async twoFactorAuthenticate(profile: MiUserProfile, token: string): Promise<void> {
		if (profile.twoFactorBackupSecret?.includes(token)) {
			await this.userProfilesRepository.update({ userId: profile.userId }, {
				twoFactorBackupSecret: profile.twoFactorBackupSecret.filter((secret) => secret !== token),
			});
		} else {
			// 1. 判定に用いるタイムスタンプを固定
			const now = Date.now();
			const normalizedToken = token.trim();
			const validationWindow = 1;
			const timeStep = 30; // TOTPの周期（秒）

			// 2. TOTPインスタンスを生成（設定を一元管理するため）
			const totp = new OTPAuth.TOTP({
				secret: OTPAuth.Secret.fromBase32(profile.twoFactorSecret!),
				digits: 6,
				period: timeStep,
			});

			// 3. 固定したタイムスタンプを使って検証
			const delta = totp.validate({
				token: normalizedToken,
				window: validationWindow,
				timestamp: now,
			});

			if (delta === null) {
				throw new Error('authentication failed');
			}

			if (process.env.NODE_ENV !== 'test' || process.env.MISSKEY_TEST_CHECK_DUPLICATED_TOTP === '1') {
				// 4. totp.counter() を用い、同じタイムスタンプから基準ステップを取得
				const currentStep = totp.counter({ timestamp: now });
				const step = currentStep + delta;
				const secretFingerprint = createHash('sha256')
					.update(profile.twoFactorSecret ?? '')
					.digest('base64url');

				const usedTokenRedisKey = `2fa:used:${profile.userId}:${secretFingerprint}:${step}`;

				// 5. TTL（有効期限）の設定
				const ttl = timeStep * (validationWindow * 2 + 1);
				const setResult = await this.redisClient.set(usedTokenRedisKey, normalizedToken, 'EX', ttl, 'NX');

				if (setResult === null) {
					throw new Error('authentication failed');
				}
			}
		}
	}
}
