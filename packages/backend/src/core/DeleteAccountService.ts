import { Inject, Injectable } from '@/di-decorators.js';
import type { UsersRepository } from '@/models/index.js';
import { QueueService } from '@/core/QueueService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class DeleteAccountService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.UserSuspendService)
		private userSuspendService: UserSuspendService,

		@Inject(DI.QueueService)
		private queueService: QueueService,

		@Inject(DI.GlobalEventService)
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async deleteAccount(user: {
		id: string;
		host: string | null;
	}): Promise<void> {
		const _user = await this.usersRepository.findOneByOrFail({ id: user.id });
		if (_user.isRoot) throw new Error('cannot delete a root account');

		// 物理削除する前にDelete activityを送信する
		await this.userSuspendService.doPostSuspend(user).catch(e => {});
	
		this.queueService.createDeleteAccountJob(user, {
			soft: false,
		});
	
		await this.usersRepository.update(user.id, {
			isDeleted: true,
		});
	
		// Terminate streaming
		this.globalEventService.publishUserEvent(user.id, 'terminate', {});
	}
}
