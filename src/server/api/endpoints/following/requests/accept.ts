import $ from 'cafy'; import ID from '../../../../../cafy-id';
import acceptFollowRequest from '../../../../../services/following/requests/accept';
import User from '../../../../../models/user';

/**
 * Accept a follow request
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'followerId' parameter
	const [followerId, followerIdErr] = $.type(ID).get(params.followerId);
	if (followerIdErr) return rej('invalid followerId param');

	// Fetch follower
	const follower = await User.findOne({
		_id: followerId
	});

	if (follower === null) {
		return rej('follower not found');
	}

	await acceptFollowRequest(user, follower);

	// Send response
	res();
});
