/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack as packUser } from '../../models/user';
import Following from '../../models/following';
import notify from '../../common/notify';
import event from '../../event';

/**
 * Follow a user
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const follower = user;

	// Get 'user_id' parameter
	const [userId, userIdErr] = $(params.user_id).id().$;
	if (userIdErr) return rej('invalid user_id param');

	// 自分自身
	if (user._id.equals(userId)) {
		return rej('followee is yourself');
	}

	// Get followee
	const followee = await User.findOne({
		_id: userId
	}, {
		fields: {
			data: false,
			'account.profile': false
		}
	});

	if (followee === null) {
		return rej('user not found');
	}

	// Check if already following
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
	event(follower._id, 'follow', await packUser(followee, follower));
	event(followee._id, 'followed', await packUser(follower, followee));

	// Notify
	notify(followee._id, follower._id, 'follow');
});
