import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Following from '../../../../models/following';
import define from '../../define';
import { error } from '../../../../prelude/promise';

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
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	}
};

export default define(meta, (ps, user) => Following.findOne({
		followerId: user._id,
		followeeId: ps.userId
	})
	.then(x =>
		x === null ? error('following not found') :
		Following.update({ _id: x._id }, {
			$set: { stalk: true }
	}))
	.then(() => {}));
