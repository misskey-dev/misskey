import $ from 'cafy'; import ID from '../../../../../cafy-id';
import cancelFollowRequest from '../../../../../services/following/requests/cancel';
import User, { pack, ILocalUser } from '../../../../../models/user';

/**
 * Cancel a follow request
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [followeeId, followeeIdErr] = $.type(ID).get(params.userId);
	if (followeeIdErr) return rej('invalid userId param');

	// Fetch followee
	const followee = await User.findOne({
		_id: followeeId
	});

	if (followee === null) {
		return rej('followee not found');
	}

	await cancelFollowRequest(followee, user);

	// Send response
	res(await pack(followee._id, user));
});
