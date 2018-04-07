/**
 * Module dependencies
 */
import User, { pack } from '../../../models/user';

/**
 * Show myself
 */
module.exports = (params, user, _, isSecure) => new Promise(async (res, rej) => {
	// Serialize
	res(await pack(user, user, {
		detail: true,
		includeSecrets: isSecure
	}));

	// Update lastUsedAt
	User.update({ _id: user._id }, {
		$set: {
			lastUsedAt: new Date()
		}
	});
});
