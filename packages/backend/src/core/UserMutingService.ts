/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull, LessThan, MoreThan } from 'typeorm';
import type { MutingsRepository, MiMuting } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';

@Injectable()
export class UserMutingService {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private idService: IdService,
		private cacheService: CacheService,
	) {
	}

	@bindThis
	public async mute(user: MiUser, target: MiUser, expiresAt: Date | null = null): Promise<void> {
		// 二重ミュートでユニーク制約違反の生エラーが露出しないよう冪等化する
		// 期限切れ済みの行は後続の insert で掃き直されるため、実効中のミュートのみを判定対象にする
		if (await this.existsActiveMuting(user, target)) return;

		await this.insertMuting(user, target, expiresAt);

		this.cacheService.userMutingsCache.refresh(user.id);
	}

	@bindThis
	private async existsActiveMuting(user: MiUser, target: MiUser): Promise<boolean> {
		return await this.mutingsRepository.exists({
			where: [
				{ muterId: user.id, muteeId: target.id, expiresAt: IsNull() },
				{ muterId: user.id, muteeId: target.id, expiresAt: MoreThan(new Date()) },
			],
		});
	}

	@bindThis
	private async insertMuting(user: MiUser, target: MiUser, expiresAt: Date | null): Promise<void> {
		const insert = () => this.mutingsRepository.insert({
			id: this.idService.gen(),
			expiresAt: expiresAt,
			muterId: user.id,
			muteeId: target.id,
		});

		try {
			await insert();
		} catch (e) {
			if (!isDuplicateKeyValueError(e)) throw e;

			// 並行リクエストで有効なミュートが先に作成された場合は、それを結果として扱う
			if (await this.existsActiveMuting(user, target)) return;

			// The (muterId, muteeId) unique index is occupied by a row that may have already
			// expired but not yet been cleaned up by the expiry cron. Retry after removing it.
			const expiredRows = await this.mutingsRepository.find({
				where: {
					muterId: user.id,
					muteeId: target.id,
					expiresAt: LessThan(new Date()),
				},
			});
			if (expiredRows.length === 0) throw e;

			await this.mutingsRepository.delete({ id: In(expiredRows.map(x => x.id)) });

			try {
				await insert();
			} catch (retryError) {
				if (isDuplicateKeyValueError(retryError) && await this.existsActiveMuting(user, target)) return;
				throw retryError;
			}
		}
	}

	@bindThis
	public async unmute(mutings: MiMuting[]): Promise<void> {
		if (mutings.length === 0) return;

		await this.mutingsRepository.delete({
			id: In(mutings.map(m => m.id)),
		});

		const muterIds = [...new Set(mutings.map(m => m.muterId))];
		for (const muterId of muterIds) {
			this.cacheService.userMutingsCache.refresh(muterId);
		}
	}
}
