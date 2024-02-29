import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, MutingsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserMutingService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async mute(user: User, target: User): Promise<void> {
		await this.mutingsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			muterId: user.id,
			muteeId: target.id,
		});
	}
}
