import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import * as ms from 'ms';
import User, { pack } from '../../../../models/user';
import Following from '../../../../models/following';
import deleteFollowing from '../../../../services/following/delete';
import define from '../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したユーザーのフォローを解除します。',
		'en-US': 'Unfollow a user.'
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

	// Check if the followee is yourself
	if (user._id.equals(ps.userId)) {
		return rej('followee is yourself');
	}

	// Get followee
	const followee = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			data: false,
			'profile': false
		}
	});

	if (followee === null) {
		return rej('user not found');
	}

	// Check not following
	const exist = await Following.findOne({
		followerId: follower._id,
		followeeId: followee._id
	});

	if (exist === null) {
		return rej('already not following');
	}

	// Delete following
	await deleteFollowing(follower, followee);

	// Send response
	res(await pack(followee._id, user));
}));
