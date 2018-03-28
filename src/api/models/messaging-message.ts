import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { pack as packUser } from './user';
import { pack as packFile } from './drive-file';
import db from '../../db/mongodb';
import parse from '../common/text';

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
 * Pack a messaging message for API response
 *
 * @param {any} message
 * @param {any} me?
 * @param {any} options?
 * @return {Promise<any>}
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

	// Parse text
	if (_message.text) {
		_message.ast = parse(_message.text);
	}

	// Populate user
	_message.user = await packUser(_message.user_id, me);

	if (_message.file_id) {
		// Populate file
		_message.file = await packFile(_message.file_id);
	}

	if (opts.populateRecipient) {
		// Populate recipient
		_message.recipient = await packUser(_message.recipient_id, me);
	}

	resolve(_message);
});
