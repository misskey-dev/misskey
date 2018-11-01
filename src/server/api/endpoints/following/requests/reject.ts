import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import rejectFollowRequest from '../../../../../services/following/requests/reject';
import User, { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': '自分に届いた、指定したフォローリクエストを拒否します。',
		'en-US': 'Reject a follow request.'
	},

	requireCredential: true,

	kind: 'following-write',

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Fetch follower
	const follower = await User.findOne({
		_id: ps.userId
	});

	if (follower === null) {
		return rej('follower not found');
	}

	await rejectFollowRequest(user, follower);

	res();
});
