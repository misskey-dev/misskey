/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import User from '../../../../models/user';
import Following from '../../../../models/following';
import deleteFollowing from '../../../../services/following/delete';

/**
 * Unfollow a user
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const follower = user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $.type(ID).get(params.userId);
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
			'profile': false
		}
	});

	if (followee === null) {
		return rej('user not found');
	}

	// Check not following
	const exist = await Following.findOne({
		followerId: follower._id,
		followeeId: followee._id
	});

	if (exist === null) {
		return rej('already not following');
	}

	// Delete following
	deleteFollowing(follower, followee);

	// Send response
	res();
});
