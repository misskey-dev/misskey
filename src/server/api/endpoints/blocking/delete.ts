import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import * as ms from 'ms';
import User, { pack } from '../../../../models/user';
import Blocking from '../../../../models/blocking';
import deleteBlocking from '../../../../services/blocking/delete';
import define from '../../define';

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
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
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
	res(await pack(blockee._id, user, {
		detail: true
	}));
}));
