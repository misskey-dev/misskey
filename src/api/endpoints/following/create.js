'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import Following from '../../models/following';
import notify from '../../common/notify';
import event from '../../event';
import serializeUser from '../../serializers/user';

/**
 * Follow a user
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	const follower = user;

	// Get 'user_id' parameter
	let userId = params.user_id;
	if (userId === undefined || userId === null) {
		return rej('user_id is required');
	}

	// Validate id
	if (!mongo.ObjectID.isValid(userId)) {
		return rej('incorrect user_id');
	}

	// 自分自身
	if (user._id.equals(userId)) {
		return rej('followee is yourself');
	}

	// Get followee
	const followee = await User.findOne({
		_id: new mongo.ObjectID(userId)
	}, {
		fields: {
			data: false,
			profile: false
		}
	});

	if (followee === null) {
		return rej('user not found');
	}

	// Check already following
	const exist = await Following.findOne({
		follower_id: follower._id,
		followee_id: followee._id,
		deleted_at: { $exists: false }
	});

	if (exist !== null) {
		return rej('already following');
	}

	// Create following
	await Following.insert({
		created_at: new Date(),
		follower_id: follower._id,
		followee_id: followee._id
	});

	// Send response
	res();

	// Increment following count
	User.update(follower._id, {
		$inc: {
			following_count: 1
		}
	});

	// Increment followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followers_count: 1
		}
	});

	// Publish follow event
	event(follower._id, 'follow', await serializeUser(followee, follower));
	event(followee._id, 'followed', await serializeUser(follower, followee));

	// Notify
	notify(followee._id, follower._id, 'follow');
});
