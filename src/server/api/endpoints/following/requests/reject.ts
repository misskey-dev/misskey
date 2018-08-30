import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import rejectFollowRequest from '../../../../../services/following/requests/reject';
import User, { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '自分に届いた、指定したフォローリクエストを拒否します。',
		'en-US': 'Reject a follow request.'
	},

	requireCredential: true,

	kind: 'following-write'
};

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
