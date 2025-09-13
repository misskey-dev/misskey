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
import { QueueService } from '@/core/QueueService.js';

@Injectable()
export class UserMutingService {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private idService: IdService,
		private cacheService: CacheService,
		private queueService: QueueService,
	) {
	}

	@bindThis
	public async mute(user: MiUser, target: MiUser, expiresAt: Date | null = null): Promise<void> {
		const inserted = await this.mutingsRepository.insertOne({
			id: this.idService.gen(),
			expiresAt: expiresAt ?? null,
			muterId: user.id,
			muteeId: target.id,
		});

		this.cacheService.userMutingsCache.refresh(user.id);

		if (expiresAt != null) {
			const delay = expiresAt.getTime() - Date.now();
			this.queueService.deleteUserMutingQueue.add(inserted.id, {
				mutingId: inserted.id,
			}, {
				delay,
				removeOnComplete: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 30,
				},
				removeOnFail: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 100,
				},
			});
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

	@bindThis
	public async deleteExpired(): Promise<void> {
		const expired = await this.mutingsRepository.createQueryBuilder('muting')
			.where('muting.expiresAt IS NOT NULL')
			.andWhere('muting.expiresAt < :now', { now: new Date() })
			.innerJoinAndSelect('muting.mutee', 'mutee')
			.getMany();

		if (expired.length > 0) {
			await this.unmute(expired);
		}
	}

	@bindThis
	public async unmuteById(mutingId: MiMuting['id']): Promise<void> {
		const muting = await this.mutingsRepository.findOneBy({ id: mutingId });
		if (muting == null) return;

		await this.unmute([muting]);
	}
}
