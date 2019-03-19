import * as mongo from 'mongodb';
import { deepcopy } from '../misc/deepcopy';
import { pack as packUser } from './user';
import { pack as packFile } from './drive-file';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import { length } from 'stringz';

const MessagingMessage = db.get<IMessagingMessage>('messagingMessages');
MessagingMessage.createIndex('userId');
MessagingMessage.createIndex('recipientId');
export default MessagingMessage;

export interface IMessagingMessage {
	_id: mongo.ObjectID;
	createdAt: Date;
	text: string;
	userId: mongo.ObjectID;
	recipientId: mongo.ObjectID;
	isRead: boolean;
	fileId: mongo.ObjectID;
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
			_id: message
		});
	} else if (typeof message === 'string') {
		_message = await MessagingMessage.findOne({
			_id: new mongo.ObjectID(message)
		});
	} else {
		_message = deepcopy(message);
	}

	// Rename _id to id
	_message.id = _message._id;
	delete _message._id;

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
