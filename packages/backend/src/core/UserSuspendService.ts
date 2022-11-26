import { Inject, Injectable } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import type { FollowingsRepository, UsersRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ApRendererService } from './remote/activitypub/ApRendererService.js';
import { UserEntityService } from './entities/UserEntityService.js';

@Injectable()
export class UserSuspendService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private apRendererService: ApRendererService,
	) {
	}

	public async doPostSuspend(user: { id: User['id']; host: User['host'] }): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: true });
	
		if (this.userEntityService.isLocalUser(user)) {
			// 知り得る全SharedInboxにDelete配信
			const content = this.apRendererService.renderActivity(this.apRendererService.renderDelete(`${this.config.url}/users/${user.id}`, user));
	
			const queue: string[] = [];
	
			const followings = await this.followingsRepository.find({
				where: [
					{ followerSharedInbox: Not(IsNull()) },
					{ followeeSharedInbox: Not(IsNull()) },
				],
				select: ['followerSharedInbox', 'followeeSharedInbox'],
			});
	
			const inboxes = followings.map(x => x.followerSharedInbox ?? x.followeeSharedInbox);
	
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
			const content = this.apRendererService.renderActivity(this.apRendererService.renderUndo(this.apRendererService.renderDelete(`${this.config.url}/users/${user.id}`, user), user));
	
			const queue: string[] = [];
	
			const followings = await this.followingsRepository.find({
				where: [
					{ followerSharedInbox: Not(IsNull()) },
					{ followeeSharedInbox: Not(IsNull()) },
				],
				select: ['followerSharedInbox', 'followeeSharedInbox'],
			});
	
			const inboxes = followings.map(x => x.followerSharedInbox ?? x.followeeSharedInbox);
	
			for (const inbox of inboxes) {
				if (inbox != null && !queue.includes(inbox)) queue.push(inbox);
			}
	
			for (const inbox of queue) {
				this.queueService.deliver(user as any, content, inbox);
			}
		}
	}
}
