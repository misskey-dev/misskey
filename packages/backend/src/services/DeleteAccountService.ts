import { Inject, Injectable } from '@nestjs/common';
import type { Users } from '@/models/index.js';
import { QueueService } from '@/services/QueueService.js';
import { UserSuspendService } from '@/services/UserSuspendService.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class DeleteAccountService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: typeof Users,

		private userSuspendService: UserSuspendService,
		private queueService: QueueService,
		private globalEventServie: GlobalEventService,
	) {
	}

	public async deleteAccount(user: {
		id: string;
		host: string | null;
	}): Promise<void> {
		// 物理削除する前にDelete activityを送信する
		await this.userSuspendService.doPostSuspend(user).catch(e => {});
	
		this.queueService.createDeleteAccountJob(user, {
			soft: false,
		});
	
		await this.usersRepository.update(user.id, {
			isDeleted: true,
		});
	
		// Terminate streaming
		this.globalEventServie.publishUserEvent(user.id, 'terminate', {});
	}
}
