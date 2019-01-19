import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import cancelFollowRequest from '../../../../../services/following/requests/cancel';
import User, { pack } from '../../../../../models/user';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

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
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	}
};

export default define(meta, (ps, user) => User.findOne({ _id: ps.userId })
	.then(x =>
		x === null ? error('followee not found') :
		cancelFollowRequest(x, user)
			.then(() => pack(x._id, user))));
