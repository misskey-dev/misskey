'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import Following from '../../models/following';
import event from '../../event';
import serializeUser from '../../serializers/user';

/**
 * Unfollow a user
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

	// Check if the followee is yourself
	if (user._id.equals(userId)) {
		return rej('followee is yourself');
	}

	// Get followee
	const followee = await User.findOne({
		_id: new mongo.ObjectID(userId)
	});

	if (followee === null) {
		return rej('user not found');
	}

	// Check not following
	const exist = await Following.findOne({
		follower_id: follower._id,
		followee_id: followee._id,
		deleted_at: { $exists: false }
	});

	if (exist === null) {
		return rej('already not following');
	}

	// Delete following
	await Following.update({
		_id: exist._id
	}, {
		$set: {
			deleted_at: new Date()
		}
	});

	// Send response
	res();

	// Decrement following count
	User.update({ _id: follower._id }, {
		$inc: {
			following_count: -1
		}
	});

	// Decrement followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followers_count: -1
		}
	});

	// Publish follow event
	event(follower._id, 'unfollow', await serializeUser(followee, follower));
});
