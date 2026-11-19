/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { MutingsRepository, MiMuting } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
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
		// 過去の日時が指定された場合は即期限切れになるため、無期限として扱う
		const normalizedExpiresAt = (expiresAt != null && expiresAt.getTime() > Date.now()) ? expiresAt : null;

		// 二重ミュートでユニーク制約違反の生エラーが露出しないよう冪等化する
		const exist = await this.mutingsRepository.existsBy({ muterId: user.id, muteeId: target.id });
		if (exist) return;

		await this.mutingsRepository.insert({
			id: this.idService.gen(),
			expiresAt: normalizedExpiresAt,
			muterId: user.id,
			muteeId: target.id,
		});

		this.cacheService.userMutingsCache.refresh(user.id);
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
