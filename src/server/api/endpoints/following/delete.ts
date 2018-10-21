import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
const ms = require('ms');
import User, { pack, ILocalUser } from '../../../../models/user';
import Following from '../../../../models/following';
import deleteFollowing from '../../../../services/following/delete';
import getParams from '../../get-params';

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
		userId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
