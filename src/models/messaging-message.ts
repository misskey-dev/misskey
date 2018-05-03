import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { pack as packUser } from './user';
import { pack as packFile } from './drive-file';
import db from '../db/mongodb';
import MessagingHistory, { deleteMessagingHistory } from './messaging-history';

const MessagingMessage = db.get<IMessagingMessage>('messagingMessages');
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
	return text.length <= 1000 && text.trim() != '';
}

/**
 * MessagingMessageを物理削除します
 */
export async function deleteMessagingMessage(messagingMessage: string | mongo.ObjectID | IMessagingMessage) {
	let m: IMessagingMessage;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(messagingMessage)) {
		m = await MessagingMessage.findOne({
			_id: messagingMessage
		});
	} else if (typeof messagingMessage === 'string') {
		m = await MessagingMessage.findOne({
			_id: new mongo.ObjectID(messagingMessage)
		});
	} else {
		m = messagingMessage as IMessagingMessage;
	}

	if (m == null) return;

	// このMessagingMessageを指すMessagingHistoryをすべて削除
	await Promise.all((
		await MessagingHistory.find({ messageId: m._id })
	).map(x => deleteMessagingHistory(x)));

	// このMessagingMessageを削除
	await MessagingMessage.remove({
		_id: m._id
	});
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
	if (mongo.ObjectID.prototype.isPrototypeOf(message)) {
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
