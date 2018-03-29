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

	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).id().$;
	if (userIdErr) return rej('invalid userId param');

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
		muterId: muter._id,
		muteeId: mutee._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		return rej('already not muting');
	}

	// Delete mute
	await Mute.update({
		_id: exist._id
	}, {
		$set: {
			deletedAt: new Date()
		}
	});

	// Send response
	res();
});
