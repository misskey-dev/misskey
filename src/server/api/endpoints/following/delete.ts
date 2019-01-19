import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
const ms = require('ms');
import User, { pack } from '../../../../models/user';
import Following from '../../../../models/following';
import deleteFollowing from '../../../../services/following/delete';
import define from '../../define';
import { ObjectID } from 'mongodb';
import { error, errorWhen } from '../../../../prelude/promise';

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

const ensureNotExist = (followerId: ObjectID, followeeId: ObjectID) =>
	Following.findOne({ followerId, followeeId })
		.then(x => x === null && error('already not following'));

export default define(meta, (ps, user) => errorWhen(
	user._id.equals(ps.userId),
	'followee is yourself')
	.then(() => User.findOne({ _id: ps.userId }, {
			fields: {
				data: false,
				'profile': false
			}
		}))
	.then(x =>
		x === null ? error('user not found') :
		ensureNotExist(user._id, x._id)
			.then(() => deleteFollowing(user, x))
			.then(() => pack(x._id, user))));
