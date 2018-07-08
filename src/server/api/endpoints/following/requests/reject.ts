import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import rejectFollowRequest from '../../../../../services/following/requests/reject';
import User, { ILocalUser } from '../../../../../models/user';

/**
 * Reject a follow request
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
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
