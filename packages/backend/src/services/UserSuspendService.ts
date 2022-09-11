import { Inject, Injectable } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import type { Followings , Users } from '@/models/index.js';

import type { User } from '@/models/entities/user';
import type { QueueService } from '@/queue/queue.service';
import renderDelete from '@/remote/activitypub/renderer/delete.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import config from '@/config/index.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';

@Injectable()
export class UserSuspendService {
	constructor(
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
	
		if (this.usersRepository.isLocalUser(user)) {
			// 知り得る全SharedInboxにDelete配信
			const content = renderActivity(renderDelete(`${config.url}/users/${user.id}`, user));
	
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
	
		if (this.usersRepository.isLocalUser(user)) {
			// 知り得る全SharedInboxにUndo Delete配信
			const content = renderActivity(renderUndo(renderDelete(`${config.url}/users/${user.id}`, user), user));
	
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
