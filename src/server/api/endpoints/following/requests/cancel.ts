import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import cancelFollowRequest from '../../../../../services/following/requests/cancel';
import User, { pack, ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

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
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
