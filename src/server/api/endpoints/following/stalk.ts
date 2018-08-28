import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Following from '../../../../models/following';
import { ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーをストーキングします。',
		'en-US': 'Stalk a user.'
	},

	requireCredential: true,

	kind: 'following-write'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const follower = user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $.type(ID).get(params.userId);
	if (userIdErr) return rej('invalid userId param');

	// Fetch following
	const following = await Following.findOne({
		followerId: follower._id,
		followeeId: userId
	});

	if (following === null) {
		return rej('following not found');
	}

	// Stalk
	await Following.update({ _id: following._id }, {
		$set: {
			stalk: true
		}
	});

	// Send response
	res();

	// TODO: イベント
});
