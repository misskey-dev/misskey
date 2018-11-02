import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Following from '../../../../models/following';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーをストーキングします。',
		'en-US': 'Stalk a user.'
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

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
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
			stalk: true
		}
	});

	res();

	// TODO: イベント
}));
