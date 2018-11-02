import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを公式アカウントにします。',
		'en-US': 'Mark a user as verified.'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to verify'
			}
		},
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		return rej('user not found');
	}

	await User.findOneAndUpdate({
		_id: user._id
	}, {
			$set: {
				isVerified: true
			}
		});

	res();
}));
