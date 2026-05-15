/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { BlockingsRepository } from '@/models/_.js';
import type { MiBlocking } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import { CacheService } from '@/core/CacheService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';

/**
 * Blocking ドメインに対する DB / キャッシュアクセスを束ねた薄いデータアクセス層。
 * また、キャッシュの鮮度を保つ為の更新処理や、更新イベントの発行もデータアクセス層の責務に含める。
 */
@Injectable()
export class BlockingDataAccessService {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private cacheService: CacheService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async isBlocking(blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<boolean> {
		return (await this.cacheService.userBlockingCache.fetch(blockerId)).has(blockeeId);
	}

	@bindThis
	public findBlocking(blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<MiBlocking | null> {
		return this.blockingsRepository.findOneBy({
			blockerId,
			blockeeId,
		});
	}

	@bindThis
	public async createBlocking(blocking: MiBlocking): Promise<void> {
		await this.blockingsRepository.insert(blocking);

		this.cacheService.userBlockingCache.refresh(blocking.blockerId);
		this.cacheService.userBlockedCache.refresh(blocking.blockeeId);

		this.globalEventService.publishInternalEvent('blockingCreated', {
			blockerId: blocking.blockerId,
			blockeeId: blocking.blockeeId,
		});
	}

	@bindThis
	public async deleteBlocking(blockingId: MiBlocking['id'], blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<void> {
		await this.blockingsRepository.delete(blockingId);

		this.cacheService.userBlockingCache.refresh(blockerId);
		this.cacheService.userBlockedCache.refresh(blockeeId);

		this.globalEventService.publishInternalEvent('blockingDeleted', {
			blockerId,
			blockeeId,
		});
	}

	/**
	 * `(blockerId, blockeeId)` のペアで blocking レコードを探し、見つかれば削除する。
	 *
	 * 既存 `MiBlocking` の id を呼び出し元が把握していないケース
	 * (例: フォロー受信時の古い block 解消) 向けの便利メソッド。
	 */
	@bindThis
	public async deleteBlockingBetween(blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<void> {
		const blocking = await this.findBlocking(blockerId, blockeeId);
		if (blocking == null) {
			return;
		}

		await this.deleteBlocking(blocking.id, blockerId, blockeeId);
	}
}
