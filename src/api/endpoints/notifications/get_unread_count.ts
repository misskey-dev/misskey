/**
 * Module dependencies
 */
import Notification from '../../models/notification';

/**
 * Get count of unread notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const count = await Notification
		.count({
			notifiee_id: user._id,
			is_read: false
		});

	res({
		count: count
	});
});
