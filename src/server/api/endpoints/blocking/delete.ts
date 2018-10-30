import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
const ms = require('ms');
import User, { pack, ILocalUser } from '../../../../models/user';
import Blocking from '../../../../models/blocking';
import deleteBlocking from '../../../../services/blocking/delete';
import getParams from '../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したユーザーのブロックを解除します。',
		'en-US': 'Unblock a user.'
	},

	limit: {
		duration: ms('1hour'),
		max: 100
	},

	requireCredential: true,

	kind: 'following-write',

	params: {
		userId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const blocker = user;

	// Check if the blockee is yourself
	if (user._id.equals(ps.userId)) {
		return rej('blockee is yourself');
	}

	// Get blockee
	const blockee = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			data: false,
			'profile': false
		}
	});

	if (blockee === null) {
		return rej('user not found');
	}

	// Check not blocking
	const exist = await Blocking.findOne({
		blockerId: blocker._id,
		blockeeId: blockee._id
	});

	if (exist === null) {
		return rej('already not blocking');
	}

	// Delete blocking
	await deleteBlocking(blocker, blockee);

	// Send response
	res(await pack(blockee._id, user));
});
