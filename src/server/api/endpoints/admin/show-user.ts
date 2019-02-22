import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの情報を取得します。',
	},

	tags: ['admin'],

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

export default define(meta, async (ps, me) => {
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		throw new Error('user not found');
	}

	if (me.isModerator && user.isAdmin) {
		throw new Error('cannot show info of admin');
	}

	return user;
});
