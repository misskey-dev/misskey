import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import User from '../../../../../models/user';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーをモデレーター解除します。',
		'en-US': 'Unmark a user as moderator.'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID'
			}
		},
	}
};

export default define(meta, ps => User.findOne({ _id: ps.userId })
	.then(x =>
		!x ? error('user not found') :
		User.update({ _id: x._id }, {
			$set: { isModerator: false }
		}))
	.then(() => {}));
