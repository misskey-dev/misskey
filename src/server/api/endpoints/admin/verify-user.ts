import $ from 'cafy';
import ID from '../../../../misc/cafy-id';
import getParams from '../../get-params';
import User from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを公式アカウントにします。',
		'en-US': 'Mark a user as verified.'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {
		userId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to verify'
			}
		}),
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
