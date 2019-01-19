import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import { error } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します。',
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

export default define(meta, (ps, me) => User.findOne({ _id: ps.userId })
	.then(x =>
		!x ? error('user not found') :
		me.isModerator && x.isAdmin ? error('cannot show info of admin') :
		x));
