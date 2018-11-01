import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Following from '../../../../models/following';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのストーキングをやめます。',
		'en-US': 'Unstalk a user.'
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

	const follower = user;

	// Fetch following
	const following = await Following.findOne({
		followerId: follower._id,
		followeeId: ps.userId
	});

	if (following === null) {
		return rej('following not found');
	}

	// Stalk
	await Following.update({ _id: following._id }, {
		$set: {
			stalk: false
		}
	});

	res();

	// TODO: イベント
});
