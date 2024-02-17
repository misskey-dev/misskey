import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiNoteNotification } from '@/models/NoteNotification.js';
import type { MiUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import { NotificationService } from '@/core/NotificationService.js';
import { DI } from '@/di-symbols.js';
import type { NoteNotificationsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class NoteNotificationService implements OnApplicationShutdown {
	private targetUsersFetched: boolean;
	private targetUsers: MiNoteNotification[];

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
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'noteNotificationCreated':
					// TODO: typecheck回避（WIP）、きれいに書く
					this.targetUsers.push({ ...body, targetUser: body.targetUser as MiUser, user: body.user as MiUser });
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
	public async sendNotificationToSubscriber(note: MiNote, noteUser: { id: MiUser['id']; username: string; host: string | null; }): Promise<void> {
		if (!['public', 'home'].includes(note.visibility)) return;

		const targetUsers = await this.getTargetUsers();
		const matchedTargets = Array.from(targetUsers.filter(x => x.targetUserId === noteUser.id));

		matchedTargets.forEach(x => {
			this.notificationService.createNotification(x.userId, 'note', {
				noteId: note.id,
			}, noteUser.id);
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
