import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import { error } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを凍結します。',
		'en-US': 'Suspend a user.'
	},

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	}
};

export default define(meta, ps => User.findOne({ _id: ps.userId })
	.then(x =>
		!x ? error('user not found') :
		x.isAdmin ? error('cannot suspend admin') :
		User.findOneAndUpdate({ _id: x._id }, {
			$set: { isSuspended: true }
		}))
	.then(() => {}));
