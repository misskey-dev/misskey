
import { Inject, Injectable } from '@nestjs/common';
import type { Users , Mutings } from '@/models/index.js';
import { IdService } from '@/services/IdService.js';
import { QueueService } from '@/queue/queue.service.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import type { User } from '@/models/entities/User.js';

@Injectable()
export class UserMutingService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('mutingsRepository')
		private mutingsRepository: typeof Mutings,

		private idService: IdService,
		private queueService: QueueService,
		private globalEventServie: GlobalEventService,
	) {
	}

	public async mute(user: User, target: User): Promise<void> {
		await this.mutingsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			muterId: user.id,
			muteeId: target.id,
		});
	}
}
