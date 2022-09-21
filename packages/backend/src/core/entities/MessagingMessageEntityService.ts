import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MessagingMessagesRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { MessagingMessage } from '@/models/entities/MessagingMessage.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { UserGroupEntityService } from './UserGroupEntityService.js';

@Injectable()
export class MessagingMessageEntityService {
	constructor(
		@Inject(DI.messagingMessagesRepository)
		private messagingMessagesRepository: MessagingMessagesRepository,

		private userEntityService: UserEntityService,
		private userGroupEntityService: UserGroupEntityService,
		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	public async pack(
		src: MessagingMessage['id'] | MessagingMessage,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			populateRecipient?: boolean,
			populateGroup?: boolean,
		},
	): Promise<Packed<'MessagingMessage'>> {
		const opts = options ?? {
			populateRecipient: true,
			populateGroup: true,
		};

		const message = typeof src === 'object' ? src : await this.messagingMessagesRepository.findOneByOrFail({ id: src });

		return {
			id: message.id,
			createdAt: message.createdAt.toISOString(),
			text: message.text,
			userId: message.userId,
			user: await this.userEntityService.pack(message.user ?? message.userId, me),
			recipientId: message.recipientId,
			recipient: message.recipientId && opts.populateRecipient ? await this.userEntityService.pack(message.recipient ?? message.recipientId, me) : undefined,
			groupId: message.groupId,
			group: message.groupId && opts.populateGroup ? await this.userGroupEntityService.pack(message.group ?? message.groupId) : undefined,
			fileId: message.fileId,
			file: message.fileId ? await this.driveFileEntityService.pack(message.fileId) : null,
			isRead: message.isRead,
			reads: message.reads,
		};
	}
}

