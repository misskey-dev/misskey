import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { NoteNotification } from '@/models/entities/NoteNotification.js';
import type { User } from '@/models/entities/User.js';
import type { Note } from '@/models/entities/Note.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { DI } from '@/di-symbols.js';
import type { NoteNotificationsRepository } from '@/models/index.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class NoteNotificationService implements OnApplicationShutdown {
	private targetUsersFetched: boolean;
	private targetUsers: NoteNotification[];

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.noteNotificationsRepository)
		private noteNotificationsRepository: NoteNotificationsRepository,

		private notificationService: NotificationService,
	) {
		this.targetUsersFetched = false;
		this.targetUsers = [];

		this.redisForSub.on('message', this.onRedisMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisForSub.off('message', this.onRedisMessage);
	}

	@bindThis
	private async onRedisMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as StreamMessages['internal']['payload'];
			switch (type) {
				case 'noteNotificationCreated':
					this.targetUsers.push({
						...body,
						createdAt: new Date(body.createdAt),
					});
					break;
				case 'noteNotificationDeleted':
					this.targetUsers = this.targetUsers.filter(a => a.id !== body.id);
					break;
				default:
					break;
			}
		}
	}

	@bindThis
	public async sendNotificationToSubscriber(note: Note, noteUser: { id: User['id']; username: string; host: string | null; }): Promise<void> {
		if (!['public', 'home'].includes(note.visibility)) return;

		const targetUsers = await this.getTargetUsers();
		const matchedTargets = targetUsers.filter(x => x.targetUserId === noteUser.id);

		matchedTargets.forEach(x => {
			this.notificationService.createNotification(x.userId, 'note', {
				notifierId: noteUser.id,
				noteId: note.id,
			});
		});
	}

	@bindThis
	public async getTargetUsers() {
		if (!this.targetUsersFetched) {
			this.targetUsers = await this.noteNotificationsRepository.find();
			this.targetUsersFetched = true;
		}

		return this.targetUsers;
	}
}
