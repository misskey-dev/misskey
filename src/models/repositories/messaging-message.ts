import { EntityRepository, Repository } from 'typeorm';
import { MessagingMessage } from '@/models/entities/messaging-message';
import { Users, DriveFiles, UserGroups } from '../index';
import { Packed } from '@/misc/schema';
import { User } from '@/models/entities/user';

@EntityRepository(MessagingMessage)
export class MessagingMessageRepository extends Repository<MessagingMessage> {
	public validateText(text: string): boolean {
		return text.trim().length <= 1000 && text.trim() != '';
	}

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

export const packedMessagingMessageSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User' as const,
			optional: true as const, nullable: false as const,
		},
		text: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		fileId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
		},
		file: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'DriveFile' as const,
		},
		recipientId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
		},
		recipient: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'User' as const,
		},
		groupId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
		},
		group: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'UserGroup' as const,
		},
		isRead: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		reads: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id'
			}
		},
	},
};
