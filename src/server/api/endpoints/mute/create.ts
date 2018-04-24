/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import User from '../../../../models/user';
import Mute from '../../../../models/mute';

/**
 * Mute a user
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const muter = user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).type(ID).$;
	if (userIdErr) return rej('invalid userId param');

	// 自分自身
	if (user._id.equals(userId)) {
		return rej('mutee is yourself');
	}

	// Get mutee
	const mutee = await User.findOne({
		_id: userId
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

	// Send response
	res();
});
