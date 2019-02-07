import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import cancelFollowRequest from '../../../../../services/following/requests/cancel';
import User, { pack } from '../../../../../models/user';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '自分が作成した、指定したフォローリクエストをキャンセルします。',
		'en-US': 'Cancel a follow request.'
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
	// Fetch followee
	const followee = await User.findOne({
		_id: ps.userId
	});

	if (followee === null) {
		return rej('followee not found');
	}

	try {
		await cancelFollowRequest(followee, user);
	} catch (e) {
		return rej(e);
	}

	res(await pack(followee._id, user));
}));
