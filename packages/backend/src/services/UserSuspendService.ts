import { Inject, Injectable } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import type { Followings , Users } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import type { QueueService } from '@/queue/queue.service.js';
import renderDelete from '@/services/remote/activitypub/renderer/delete.js';
import renderUndo from '@/services/remote/activitypub/renderer/undo.js';
import { renderActivity } from '@/services/remote/activitypub/renderer/index.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config.js';

@Injectable()
export class UserSuspendService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		private queueService: QueueService,
		private globalEventService: GlobalEventService,
	) {
	}

	public async doPostSuspend(user: { id: User['id']; host: User['host'] }): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: true });
	
		if (this.userEntityService.isLocalUser(user)) {
			// 知り得る全SharedInboxにDelete配信
			const content = renderActivity(renderDelete(`${this.config.url}/users/${user.id}`, user));
	
			const queue: string[] = [];
	
			const followings = await this.followingsRepository.find({
				where: [
					{ followerSharedInbox: Not(IsNull()) },
					{ followeeSharedInbox: Not(IsNull()) },
				],
				select: ['followerSharedInbox', 'followeeSharedInbox'],
			});
	
			const inboxes = followings.map(x => x.followerSharedInbox || x.followeeSharedInbox);
	
			for (const inbox of inboxes) {
				if (inbox != null && !queue.includes(inbox)) queue.push(inbox);
			}
	
			for (const inbox of queue) {
				this.queueService.deliver(user, content, inbox);
			}
		}
	}

	public async doPostUnsuspend(user: User): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: false });
	
		if (this.userEntityService.isLocalUser(user)) {
			// 知り得る全SharedInboxにUndo Delete配信
			const content = renderActivity(renderUndo(renderDelete(`${this.config.url}/users/${user.id}`, user), user));
	
			const queue: string[] = [];
	
			const followings = await this.followingsRepository.find({
				where: [
					{ followerSharedInbox: Not(IsNull()) },
					{ followeeSharedInbox: Not(IsNull()) },
				],
				select: ['followerSharedInbox', 'followeeSharedInbox'],
			});
	
			const inboxes = followings.map(x => x.followerSharedInbox || x.followeeSharedInbox);
	
			for (const inbox of inboxes) {
				if (inbox != null && !queue.includes(inbox)) queue.push(inbox);
			}
	
			for (const inbox of queue) {
				this.queueService.deliver(user as any, content, inbox);
			}
		}
	}
}
