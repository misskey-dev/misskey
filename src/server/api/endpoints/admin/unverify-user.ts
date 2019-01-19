import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import { error } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの公式アカウントを解除します。',
		'en-US': 'Mark a user as unverified.'
	},

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to unverify'
			}
		},
	}
};

export default define(meta, ps => User.findOne({ _id: ps.userId })
	.then(x =>
		!x ? error('user not found') :
		User.findOneAndUpdate({ _id: x._id }, {
			$set: { isVerified: false }
		}))
	.then(() => {}));
