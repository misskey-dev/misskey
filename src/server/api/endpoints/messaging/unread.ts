/**
 * Module dependencies
 */
import Message from '../../../../models/messaging-message';
import Mute from '../../../../models/mute';

/**
 * Get count of unread messages
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});
	const mutedUserIds = mute.map(m => m.muteeId);

	const count = await Message
		.count({
			userId: {
				$nin: mutedUserIds
			},
			recipientId: user._id,
			isRead: false
		});

	res({
		count: count
	});
});
