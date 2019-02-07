import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import acceptFollowRequest from '../../../../../services/following/requests/accept';
import User from '../../../../../models/user';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '自分に届いた、指定したフォローリクエストを承認します。',
		'en-US': 'Accept a follow request.'
	},

	requireCredential: true,

	kind: 'following-write',

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch follower
	const follower = await User.findOne({
		_id: ps.userId
	});

	if (follower === null) {
		return rej('follower not found');
	}

	await acceptFollowRequest(user, follower);

	res();
}));
