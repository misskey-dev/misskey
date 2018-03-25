/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';
import Mute from '../../models/mute';

/**
 * Mute a user
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	const muter = user;

	// Get 'user_id' parameter
	const [userId, userIdErr] = $(params.user_id).id().$;
	if (userIdErr) return rej('invalid user_id param');

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
			'account.profile': false
		}
	});

	if (mutee === null) {
		return rej('user not found');
	}

	// Check if already muting
	const exist = await Mute.findOne({
		muter_id: muter._id,
		mutee_id: mutee._id,
		deleted_at: { $exists: false }
	});

	if (exist !== null) {
		return rej('already muting');
	}

	// Create mute
	await Mute.insert({
		created_at: new Date(),
		muter_id: muter._id,
		mutee_id: mutee._id,
	});

	// Send response
	res();
});
