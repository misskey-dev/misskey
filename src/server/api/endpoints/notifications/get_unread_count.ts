/**
 * Module dependencies
 */
import Notification from '../../../../models/notification';
import Mute from '../../../../models/mute';

/**
 * Get count of unread notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});
	const mutedUserIds = mute.map(m => m.muteeId);

	const count = await Notification
		.count({
			notifieeId: user._id,
			notifierId: {
				$nin: mutedUserIds
			},
			isRead: false
		});

	res({
		count: count
	});
});
