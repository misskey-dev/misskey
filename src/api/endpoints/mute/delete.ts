/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';
import Mute from '../../models/mute';

/**
 * Unmute a user
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

	// Check if the mutee is yourself
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

	// Check not muting
	const exist = await Mute.findOne({
		muter_id: muter._id,
		mutee_id: mutee._id,
		deleted_at: { $exists: false }
	});

	if (exist === null) {
		return rej('already not muting');
	}

	// Delete mute
	await Mute.update({
		_id: exist._id
	}, {
		$set: {
			deleted_at: new Date()
		}
	});

	// Send response
	res();
});
