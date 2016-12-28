'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Message from '../models/messaging-message';
import serializeUser from './user';
import serializeDriveFile from './drive-file';
const deepcopy = require('deepcopy');

/**
 * Serialize a message
 *
 * @param {Object} message
 * @param {Object} me?
 * @param {Object} options?
 * @return {Promise<Object>}
 */
export default (
	message: any,
	me: any,
	options?: {
		populateRecipient: boolean
	}
) => new Promise<Object>(async (resolve, reject) => {
	const opts = options || {
		populateRecipient: true
	};

	let _message: any;

	// Populate the message if 'message' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(message)) {
		_message = await Message.findOne({
			_id: message
		});
	} else if (typeof message === 'string') {
		_message = await Message.findOne({
			_id: new mongo.ObjectID(message)
		});
	} else {
		_message = deepcopy(message);
	}

	// Rename _id to id
	_message.id = _message._id;
	delete _message._id;

	// Populate user
	_message.user = await serializeUser(_message.user_id, me);

	if (_message.file) {
		// Populate file
		_message.file = await serializeDriveFile(_message.file_id);
	}

	if (opts.populateRecipient) {
		// Populate recipient
		_message.recipient = await serializeUser(_message.recipient_id, me);
	}

	resolve(_message);
});
