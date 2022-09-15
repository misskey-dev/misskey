import { Inject, Injectable } from '@nestjs/common';

import type { User } from '@/models/entities/User.js';
import type { UserKeypairs } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import type { UserKeypair } from '@/models/entities/UserKeypair.js';

@Injectable()
export class UserKeypairStoreService {
	#cache: Cache<UserKeypair>;

	constructor(
		@Inject('userKeypairsRepository')
		private userKeypairsRepository: typeof UserKeypairs,
	) {
		this.#cache = new Cache<UserKeypair>(Infinity);
	}

	public async getUserKeypair(userId: User['id']): Promise<UserKeypair> {
		return await this.#cache.fetch(userId, () => this.userKeypairsRepository.findOneByOrFail({ userId: userId }));
	}
}
