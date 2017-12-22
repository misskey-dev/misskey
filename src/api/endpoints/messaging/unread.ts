/**
 * Module dependencies
 */
import Message from '../../models/messaging-message';
import Mute from '../../models/mute';

/**
 * Get count of unread messages
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

	const count = await Message
		.count({
			user_id: {
				$nin: mutedUserIds
			},
			recipient_id: user._id,
			is_read: false
		});

	res({
		count: count
	});
});
