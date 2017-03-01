'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Message from '../../models/messaging-message';
import User from '../../models/user';
import serialize from '../../serializers/messaging-message';
import publishUserStream from '../../event';
import { publishMessagingStream } from '../../event';

/**
 * Get messages
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	let recipient = params.user_id;
	if (recipient !== undefined && recipient !== null) {
		recipient = await User.findOne({
			_id: new mongo.ObjectID(recipient)
		}, {
			fields: {
				_id: true
			}
		});

		if (recipient === null) {
			return rej('user not found');
		}
	} else {
		return rej('user_id is required');
	}

	// Get 'mark_as_read' parameter
	let markAsRead = params.mark_as_read;
	if (markAsRead == null) {
		markAsRead = true;
	}

	// Get 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	const since = params.since_id || null;
	const max = params.max_id || null;

	// Check if both of since_id and max_id is specified
	if (since !== null && max !== null) {
		return rej('cannot set since_id and max_id');
	}

	const query = {
		$or: [{
			user_id: user._id,
			recipient_id: recipient._id
		}, {
			user_id: recipient._id,
			recipient_id: user._id
		}]
	};

	const sort = {
		_id: -1
	};

	if (since !== null) {
		sort._id = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}

	// Issue query
	const messages = await Message
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(messages.map(async message =>
		await serialize(message, user, {
			populateRecipient: false
		}))));

	if (messages.length === 0) {
		return;
	}

	// Mark as read all
	if (markAsRead) {
		const ids = messages
			.filter(m => m.is_read == false)
			.filter(m => m.recipient_id.equals(user._id))
			.map(m => m._id);

		// Update documents
		await Message.update({
			_id: { $in: ids }
		}, {
			$set: { is_read: true }
		}, {
			multi: true
		});

		// Publish event
		publishMessagingStream(recipient._id, user._id, 'read', ids.map(id => id.toString()));

		const count = await Message
			.count({
				recipient_id: user._id,
				is_read: false
			});

		if (count == 0) {
			// 全ての(いままで未読だった)メッセージを(これで)読みましたよというイベントを発行
			publishUserStream(user._id, 'read_all_messaging_messages');
		}
	}
});
