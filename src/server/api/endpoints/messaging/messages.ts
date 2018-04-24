/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Message from '../../../../models/messaging-message';
import User from '../../../../models/user';
import { pack } from '../../../../models/messaging-message';
import read from '../../common/read-messaging-message';

/**
 * Get messages
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [recipientId, recipientIdErr] = $(params.userId).type(ID).$;
	if (recipientIdErr) return rej('invalid userId param');

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

	// Get 'markAsRead' parameter
	const [markAsRead = true, markAsReadErr] = $(params.markAsRead).optional.boolean().$;
	if (markAsReadErr) return rej('invalid markAsRead param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.type(ID).$;
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.type(ID).$;
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const query = {
		$or: [{
			userId: user._id,
			recipientId: recipient._id
		}, {
			userId: recipient._id,
			recipientId: user._id
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
	} else if (untilId) {
		query._id = {
			$lt: untilId
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
		await pack(message, user, {
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
