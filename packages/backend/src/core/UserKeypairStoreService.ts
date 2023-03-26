import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@/models/entities/User.js';
import type { UserKeypairsRepository } from '@/models/index.js';
import { KVCache } from '@/misc/cache.js';
import type { UserKeypair } from '@/models/entities/UserKeypair.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserKeypairStoreService {
	private cache: KVCache<UserKeypair>;

	constructor(
		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,
	) {
		this.cache = new KVCache<UserKeypair>(Infinity);
	}

	@bindThis
	public async getUserKeypair(userId: User['id']): Promise<UserKeypair> {
		return await this.cache.fetch(userId, () => this.userKeypairsRepository.findOneByOrFail({ userId: userId }));
	}
}
