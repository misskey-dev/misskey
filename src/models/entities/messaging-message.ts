import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { DriveFile } from './drive-file';
import { id } from '../id';

@Entity()
export class MessagingMessage {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the MessagingMessage.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The sender user ID.'
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		comment: 'The recipient user ID.'
	})
	public recipientId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public recipient: User | null;

	@Column('varchar', {
		length: 4096, nullable: true
	})
	public text: string | null;

	@Column('boolean', {
		default: false,
	})
	public isRead: boolean;

	@Column(id())
	public fileId: DriveFile['id'];

	@ManyToOne(type => DriveFile, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public file: DriveFile | null;
}

export function isValidText(text: string): boolean {
	return length(text.trim()) <= 1000 && text.trim() != '';
}

/**
 * Pack a messaging message for API response
 */
export const pack = (
	message: any,
	me?: any,
	options?: {
		populateRecipient: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = options || {
		populateRecipient: true
	};

	let _message: any;

	// Populate the message if 'message' is ID
	if (isObjectId(message)) {
		_message = await MessagingMessage.findOne({
			id: message
		});
	} else if (typeof message === 'string') {
		_message = await MessagingMessage.findOne({
			id: new mongo.ObjectID(message)
		});
	} else {
		_message = deepcopy(message);
	}

	// Rename _id to id
	_message.id = _message.id;
	delete _message.id;

	// Populate user
	_message.user = await packUser(_message.userId, me);

	if (_message.fileId) {
		// Populate file
		_message.file = await packFile(_message.fileId);
	}

	if (opts.populateRecipient) {
		// Populate recipient
		_message.recipient = await packUser(_message.recipientId, me);
	}

	resolve(_message);
});
