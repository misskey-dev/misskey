'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Notification from '../../models/notification';
import serialize from '../../serializers/notification';
import getFriends from '../../common/get-friends';

/**
 * Get notifications
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'following' parameter
	const following = params.following === 'true';

	// Get 'mark_as_read' parameter
	let markAsRead = params.mark_as_read;
	if (markAsRead == null) {
		markAsRead = true;
	} else {
		markAsRead = markAsRead === 'true';
	}

	// Get 'type' parameter
	let type = params.type;
	if (type !== undefined && type !== null) {
		type = type.split(',').map(x => x.trim());
	}

	// Get 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	const since = params.since_id || null;
	const max = params.max_id || null;

	// Check if both of since_id and max_id is specified
	if (since !== null && max !== null) {
		return rej('cannot set since_id and max_id');
	}

	const query = {
		notifiee_id: user._id
	};

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

	if (since !== null) {
		sort._id = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}

	// Issue query
	const notifications = await Notification
		.find(query, {}, {
			limit: limit,
			sort: sort
		})
		.toArray();

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
