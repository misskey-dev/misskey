import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@/models/entities/User.js';
import type { UserKeypairsRepository } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import type { UserKeypair } from '@/models/entities/UserKeypair.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class UserKeypairStoreService {
	private cache: Cache<UserKeypair>;

	constructor(
		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,
	) {
		this.cache = new Cache<UserKeypair>(Infinity);
	}

	public async getUserKeypair(userId: User['id']): Promise<UserKeypair> {
		return await this.cache.fetch(userId, () => this.userKeypairsRepository.findOneByOrFail({ userId: userId }));
	}
}
