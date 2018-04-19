/**
 * Module dependencies
 */
import $ from 'cafy';
import Notification from '../../../../models/notification';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/notification';
import { getFriendIds } from '../../common/get-friends';
import read from '../../common/read-notification';

/**
 * Get notifications
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'following' parameter
	const [following = false, followingError] =
		$(params.following).optional.boolean().$;
	if (followingError) return rej('invalid following param');

	// Get 'markAsRead' parameter
	const [markAsRead = true, markAsReadErr] = $(params.markAsRead).optional.boolean().$;
	if (markAsReadErr) return rej('invalid markAsRead param');

	// Get 'type' parameter
	const [type, typeErr] = $(params.type).optional.array('string').unique().$;
	if (typeErr) return rej('invalid type param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.id().$;
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.id().$;
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});

	const query = {
		notifieeId: user._id,
		$and: [{
			notifierId: {
				$nin: mute.map(m => m.muteeId)
			}
		}]
	} as any;

	const sort = {
		_id: -1
	};

	if (following) {
		// ID list of the user itself and other users who the user follows
		const followingIds = await getFriendIds(user._id);

		query.$and.push({
			notifierId: {
				$in: followingIds
			}
		});
	}

	if (type) {
		query.type = {
			$in: type
		};
	}

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
	const notifications = await Notification
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(notifications.map(async notification =>
		await pack(notification))));

	// Mark as read all
	if (notifications.length > 0 && markAsRead) {
		read(user._id, notifications);
	}
});
