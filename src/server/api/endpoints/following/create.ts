import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import ms = require('ms');
import User, { pack, ILocalUser, IUser } from '../../../../models/user';
import Following from '../../../../models/following';
import create from '../../../../services/following/create';
import define from '../../define';
import { ObjectID } from 'mongodb';
import { error, errorWhen } from '../../../../prelude/promise';

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

const tryCreate = async (follower: ILocalUser, followee: IUser) => create(follower, followee)
	.catch(e => Promise.reject(e && e.message ? e.message : e));

const ensureExist = (followerId: ObjectID, followeeId: ObjectID) =>
	Following.findOne({ followerId, followeeId })
		.then(x => x !== null && error('already following'));

export default define(meta, (ps, user) => errorWhen(
	user._id.equals(ps.userId),
	'followee is yourself')
	.then(() => User.findOne({ _id: ps.userId }, {
			fields: {
				data: false,
				profile: false
			}
		}))
	.then(x =>
		x === null ? error('user not found') :
		ensureExist(user._id, x._id)
			.then(() => tryCreate(user, x))
			.then(() => pack(x._id, user))));
