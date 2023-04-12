import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { MutingsRepository, Muting } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import type { User } from '@/models/entities/User.js';
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
	public async mute(user: User, target: User, expiresAt: Date | null = null): Promise<void> {
		await this.mutingsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			expiresAt: expiresAt ?? null,
			muterId: user.id,
			muteeId: target.id,
		});

		this.cacheService.userMutingsCache.refresh(user.id);
	}

	@bindThis
	public async unmute(mutings: Muting[]): Promise<void> {
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
