import $ from 'cafy'; import ID from '../../../../../cafy-id';
import rejectFollowRequest from '../../../../../services/following/requests/reject';
import User from '../../../../../models/user';

/**
 * Reject a follow request
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [followerId, followerIdErr] = $.type(ID).get(params.userId);
	if (followerIdErr) return rej('invalid userId param');

	// Fetch follower
	const follower = await User.findOne({
		_id: followerId
	});

	if (follower === null) {
		return rej('follower not found');
	}

	await rejectFollowRequest(user, follower);

	// Send response
	res();
});
