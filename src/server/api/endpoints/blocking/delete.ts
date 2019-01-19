import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
const ms = require('ms');
import User, { pack } from '../../../../models/user';
import Blocking from '../../../../models/blocking';
import deleteBlocking from '../../../../services/blocking/delete';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したユーザーのブロックを解除します。',
		'en-US': 'Unblock a user.'
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

export default define(meta, (ps, user) => errorWhen(
	user._id.equals(ps.userId),
	'blockee is yourself')
	.then(() => User.findOne({ _id: ps.userId }, {
			fields: {
				data: false,
				'profile': false
			}
		}))
	.then(async x => {
		if (x === null) throw 'user not found';
		if (await Blocking.findOne({
			blockerId: user._id,
			blockeeId: x._id
		}) === null) throw 'already not blocking';
		await deleteBlocking(user, x);
		return x._id;
	}).then(x => pack(x, user, { detail: true })));
