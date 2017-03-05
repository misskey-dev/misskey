/**
 * Module dependencies
 */
import it from 'cafy';
import Notification from '../../models/notification';
import serialize from '../../serializers/notification';
import getFriends from '../../common/get-friends';

/**
 * Get notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'following' parameter
	const [following = false, followingError] =
		it(params.following).expect.boolean().get();
	if (followingError) return rej('invalid following param');

	// Get 'mark_as_read' parameter
	const [markAsRead = true, markAsReadErr] = it(params.mark_as_read).expect.boolean().get();
	if (markAsReadErr) return rej('invalid mark_as_read param');

	// Get 'type' parameter
	const [type, typeErr] = it(params.type).expect.array().unique().allString().get();
	if (typeErr) return rej('invalid type param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = it(params.limit).expect.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = it(params.since_id).expect.id().get();
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = it(params.max_id).expect.id().get();
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
	}

	const query = {
		notifiee_id: user._id
	} as any;

	const sort = {
		_id: -1
	};

	if (following) {
		// ID list of the user itself and other users who the user follows
		const followingIds = await getFriends(user._id);

		query.notifier_id = {
			$in: followingIds
		};
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
	} else if (maxId) {
		query._id = {
			$lt: maxId
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
		await serialize(notification))));

	// Mark as read all
	if (notifications.length > 0 && markAsRead) {
		const ids = notifications
			.filter(x => x.is_read == false)
			.map(x => x._id);

		// Update documents
		await Notification.update({
			_id: { $in: ids }
		}, {
			$set: { is_read: true }
		}, {
			multi: true
		});
	}
});
