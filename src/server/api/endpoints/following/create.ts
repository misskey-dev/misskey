import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import * as ms from 'ms';
import User, { pack } from '../../../../models/user';
import Following from '../../../../models/following';
import create from '../../../../services/following/create';
import define from '../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したユーザーをフォローします。',
		'en-US': 'Follow a user.'
	},

	limit: {
		duration: ms('1hour'),
		max: 100
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
	const follower = user;

	// 自分自身
	if (user._id.equals(ps.userId)) {
		return rej('followee is yourself');
	}

	// Get followee
	const followee = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			data: false,
			profile: false
		}
	});

	if (followee === null) {
		return rej('user not found');
	}

	// Check if already following
	const exist = await Following.findOne({
		followerId: follower._id,
		followeeId: followee._id
	});

	if (exist !== null) {
		return rej('already following');
	}

	// Create following
	try {
		await create(follower, followee);
	} catch (e) {
		return rej(e && e.message ? e.message : e);
	}

	// Send response
	res(await pack(followee._id, user));
}));
