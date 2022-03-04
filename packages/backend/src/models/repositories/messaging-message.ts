import { EntityRepository, Repository } from 'typeorm';
import { MessagingMessage } from '@/models/entities/messaging-message.js';
import { Users, DriveFiles, UserGroups } from '../index.js';
import { Packed } from '@/misc/schema.js';
import { User } from '@/models/entities/user.js';

@EntityRepository(MessagingMessage)
export class MessagingMessageRepository extends Repository<MessagingMessage> {
	public async pack(
		src: MessagingMessage['id'] | MessagingMessage,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			populateRecipient?: boolean,
			populateGroup?: boolean,
		}
	): Promise<Packed<'MessagingMessage'>> {
		const opts = options || {
			populateRecipient: true,
			populateGroup: true,
		};

		const message = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: message.id,
			createdAt: message.createdAt.toISOString(),
			text: message.text,
			userId: message.userId,
			user: await Users.pack(message.user || message.userId, me),
			recipientId: message.recipientId,
			recipient: message.recipientId && opts.populateRecipient ? await Users.pack(message.recipient || message.recipientId, me) : undefined,
			groupId: message.groupId,
			group: message.groupId && opts.populateGroup ? await UserGroups.pack(message.group || message.groupId) : undefined,
			fileId: message.fileId,
			file: message.fileId ? await DriveFiles.pack(message.fileId) : null,
			isRead: message.isRead,
			reads: message.reads,
		};
	}
}
