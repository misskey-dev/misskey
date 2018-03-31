/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack as packUser } from '../../../../models/user';
import Following from '../../../../models/following';
import notify from '../../common/notify';
import event from '../../../../common/event';

/**
 * Follow a user
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const follower = user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).id().$;
	if (userIdErr) return rej('invalid userId param');

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
		followerId: follower._id,
		followeeId: followee._id,
		deletedAt: { $exists: false }
	});

	if (exist !== null) {
		return rej('already following');
	}

	// Create following
	await Following.insert({
		createdAt: new Date(),
		followerId: follower._id,
		followeeId: followee._id
	});

	// Send response
	res();

	// Increment following count
	User.update(follower._id, {
		$inc: {
			followingCount: 1
		}
	});

	// Increment followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: 1
		}
	});

	// Publish follow event
	event(follower._id, 'follow', await packUser(followee, follower));
	event(followee._id, 'followed', await packUser(follower, followee));

	// Notify
	notify(followee._id, follower._id, 'follow');
});
