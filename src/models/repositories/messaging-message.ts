import { EntityRepository, Repository } from 'typeorm';
import { MessagingMessage } from '../entities/messaging-message';
import { Users, DriveFiles } from '..';

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

		const message = typeof src === 'object' ? src : await this.findOne(src);

		return {
			id: message.id,
			createdAt: message.createdAt,
			text: message.text,
			user: await Users.pack(message.user || message.userId, me),
			recipient: opts.populateRecipient ? await Users.pack(message.recipient || message.recipientId, me) : null,
			file: message.fileId ? await DriveFiles.pack(message.fileId) : null,
		};
	}
}
