/**
 * Module dependencies
 */
import $ from 'cafy';
import Message from '../../models/messaging-message';
import User from '../../models/user';
import serialize from '../../serializers/messaging-message';
import read from '../../common/read-messaging-message';

/**
 * Get messages
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'user_id' parameter
	const [recipientId, recipientIdErr] = $(params.user_id).id().$;
	if (recipientIdErr) return rej('invalid user_id param');

	// Fetch recipient
	const recipient = await User.findOne({
		_id: recipientId
	}, {
		fields: {
			_id: true
		}
	});

	if (recipient === null) {
		return rej('user not found');
	}

	// Get 'mark_as_read' parameter
	const [markAsRead = true, markAsReadErr] = $(params.mark_as_read).optional.boolean().$;
	if (markAsReadErr) return rej('invalid mark_as_read param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = $(params.max_id).optional.id().$;
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
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
	} as any;

	const sort = {
		_id: -1
	};

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (maxId) {
		query._id = {
			$lt: maxId
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
		read(user._id, recipient._id, messages);
	}
});
