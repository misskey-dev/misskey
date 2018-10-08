import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Notification from '../../../../models/notification';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/notification';
import { getFriendIds } from '../../common/get-friends';
import read from '../../common/read-notification';
import { ILocalUser } from '../../../../models/user';

/**
 * Get notifications
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'following' parameter
	const [following = false, followingError] =
		$.bool.optional.get(params.following);
	if (followingError) return rej('invalid following param');

	// Get 'markAsRead' parameter
	const [markAsRead = true, markAsReadErr] = $.bool.optional.get(params.markAsRead);
	if (markAsReadErr) return rej('invalid markAsRead param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional.get(params.sinceId);
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional.get(params.untilId);
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const mute = await Mute.find({
		muterId: user._id
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
	res(await packMany(notifications));

	// Mark all as read
	if (notifications.length > 0 && markAsRead) {
		read(user._id, notifications);
	}
});
