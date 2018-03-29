/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack as packUser } from '../../models/user';
import Following from '../../models/following';
import event from '../../event';

/**
 * Unfollow a user
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

	// Check if the followee is yourself
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

	// Check not following
	const exist = await Following.findOne({
		followerId: follower._id,
		followeeId: followee._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		return rej('already not following');
	}

	// Delete following
	await Following.update({
		_id: exist._id
	}, {
		$set: {
			deletedAt: new Date()
		}
	});

	// Send response
	res();

	// Decrement following count
	User.update({ _id: follower._id }, {
		$inc: {
			followingCount: -1
		}
	});

	// Decrement followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: -1
		}
	});

	// Publish follow event
	event(follower._id, 'unfollow', await packUser(followee, follower));
});
