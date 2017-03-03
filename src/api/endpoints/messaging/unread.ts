/**
 * Module dependencies
 */
import Message from '../../models/messaging-message';

/**
 * Get count of unread messages
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const count = await Message
		.count({
			recipient_id: user._id,
			is_read: false
		});

	res({
		count: count
	});
});
