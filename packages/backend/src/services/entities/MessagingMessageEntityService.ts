import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { MessagingMessages } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { MessagingMessage } from '@/models/entities/messaging-message.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class MessagingMessageEntityService {
	constructor(
		@Inject('messagingMessagesRepository')
		private messagingMessagesRepository: typeof MessagingMessages,

		private userEntityService: UserEntityService,
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
		const opts = options || {
			populateRecipient: true,
			populateGroup: true,
		};

		const message = typeof src === 'object' ? src : await this.messagingMessagesRepository.findOneByOrFail({ id: src });

		return {
			id: message.id,
			createdAt: message.createdAt.toISOString(),
			text: message.text,
			userId: message.userId,
			user: await this.userEntityService.pack(message.user || message.userId, me),
			recipientId: message.recipientId,
			recipient: message.recipientId && opts.populateRecipient ? await this.userEntityService.pack(message.recipient || message.recipientId, me) : undefined,
			groupId: message.groupId,
			group: message.groupId && opts.populateGroup ? await this.userGroupEntityService.pack(message.group || message.groupId) : undefined,
			fileId: message.fileId,
			file: message.fileId ? await this.driveFileEntityService.pack(message.fileId) : null,
			isRead: message.isRead,
			reads: message.reads,
		};
	}
}

