import { EntityRepository, Repository } from 'typeorm';
import { MessagingMessage } from '../entities/messaging-message';
import { Users, DriveFiles } from '..';
import { ensure } from '../../prelude/ensure';
import { types, bool, SchemaType } from '../../misc/schema';

export type PackedMessagingMessage = SchemaType<typeof packedMessagingMessageSchema>;

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
	): Promise<PackedMessagingMessage> {
		const opts = options || {
			populateRecipient: true
		};

		const message = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: message.id,
			createdAt: message.createdAt.toISOString(),
			text: message.text,
			userId: message.userId,
			user: await Users.pack(message.user || message.userId, me),
			recipientId: message.recipientId,
			recipient: opts.populateRecipient ? await Users.pack(message.recipient || message.recipientId, me) : undefined,
			fileId: message.fileId,
			file: message.fileId ? await DriveFiles.pack(message.fileId) : null,
			isRead: message.isRead
		};
	}
}

export const packedMessagingMessageSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this MessagingMessage.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the MessagingMessage was created.'
		},
		userId: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
		},
		user: {
			type: types.object,
			ref: 'User',
			optional: bool.true, nullable: bool.false,
		},
		text: {
			type: types.string,
			optional: bool.false, nullable: bool.true,
		},
		fileId: {
			type: types.string,
			optional: bool.true, nullable: bool.true,
			format: 'id',
		},
		file: {
			type: types.object,
			optional: bool.true, nullable: bool.true,
			ref: 'DriveFile',
		},
		recipientId: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
		},
		recipient: {
			type: types.object,
			optional: bool.true, nullable: bool.false,
			ref: 'User'
		},
		isRead: {
			type: types.boolean,
			optional: bool.true, nullable: bool.false,
		},
	},
};
