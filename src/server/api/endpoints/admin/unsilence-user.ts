import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/entities/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのサイレンスを解除します。',
		'en-US': 'Unsilence a user.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(StringID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to unsilence'
			}
		},
	}
};

export default define(meta, async (ps) => {
	const user = await Users.findOne({
		id: ps.userId
	});

	if (user == null) {
		throw new Error('user not found');
	}

	await Users.findOneAndUpdate({
		id: user.id
	}, {
		$set: {
			isSilenced: false
		}
	});

	return;
});
