import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーをサイレンスにします。',
		'en-US': 'Make silence a user.'
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
				'en-US': 'The user ID which you want to make silence'
			}
		},
	}
};

export default define(meta, async (ps) => {
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot silence admin');
	}

	await User.findOneAndUpdate({
		_id: user._id
	}, {
		$set: {
			isSilenced: true
		}
	});

	return;
});
