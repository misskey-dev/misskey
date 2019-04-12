import { EntityRepository, Repository } from 'typeorm';
import { MessagingMessage } from '../entities/messaging-message';
import { Users, DriveFiles } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(MessagingMessage)
export class MessagingMessageRepository extends Repository<MessagingMessage> {
	public isValidText(text: string): boolean {
		return text.trim().length <= 1000 && text.trim() != '';
	}

	public async pack(
		src: MessagingMessage['id'] | MessagingMessage,
		me?: any,
		options?: {
			populateRecipient: boolean
		}
	) {
		const opts = options || {
			populateRecipient: true
		};

		const message = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: message.id,
			createdAt: message.createdAt,
			text: message.text,
			userId: message.userId,
			user: await Users.pack(message.user || message.userId, me),
			recipientId: message.recipientId,
			recipient: opts.populateRecipient ? await Users.pack(message.recipient || message.recipientId, me) : null,
			fileId: message.fileId,
			file: message.fileId ? await DriveFiles.pack(message.fileId) : null,
			isRead: message.isRead
		};
	}
}
