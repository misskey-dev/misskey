import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import User, { ILocalUser } from '../../../../models/user';
import Mute from '../../../../models/mute';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーをミュートします。',
		'en-US': 'Mute a user'
	},

	requireCredential: true,

	kind: 'account/write',

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const muter = user;

	// 自分自身
	if (user._id.equals(ps.userId)) {
		return rej('mutee is yourself');
	}

	// Get mutee
	const mutee = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			data: false,
			profile: false
		}
	});

	if (mutee === null) {
		return rej('user not found');
	}

	// Check if already muting
	const exist = await Mute.findOne({
		muterId: muter._id,
		muteeId: mutee._id
	});

	if (exist !== null) {
		return rej('already muting');
	}

	// Create mute
	await Mute.insert({
		createdAt: new Date(),
		muterId: muter._id,
		muteeId: mutee._id,
	});

	res();
});
