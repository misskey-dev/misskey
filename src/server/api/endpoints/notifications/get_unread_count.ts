/**
 * Module dependencies
 */
import Notification from '../../models/notification';
import Mute from '../../models/mute';

/**
 * Get count of unread notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const mute = await Mute.find({
		muter_id: user._id,
		deleted_at: { $exists: false }
	});
	const mutedUserIds = mute.map(m => m.mutee_id);

	const count = await Notification
		.count({
			notifiee_id: user._id,
			notifier_id: {
				$nin: mutedUserIds
			},
			is_read: false
		});

	res({
		count: count
	});
});
