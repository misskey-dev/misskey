/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../../../models/user';
import Following from '../../../../models/following';
import { createHttp } from '../../../../queue';

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

	createHttp({
		type: 'unfollow',
		id: exist._id
	}).save(error => {
		if (error) {
			return rej('unfollow failed');
		}

		// Send response
		res();
	});
});
