import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import rejectFollowRequest from '../../../../../services/following/requests/reject';
import User from '../../../../../models/user';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '自分に届いた、指定したフォローリクエストを拒否します。',
		'en-US': 'Reject a follow request.'
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

export default define(meta, (ps, user) =>  User.findOne({ _id: ps.userId })
	.then(x =>
		x === null ? error('follower not found') :
		(rejectFollowRequest(user, x)), undefined));
