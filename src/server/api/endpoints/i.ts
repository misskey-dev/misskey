/**
 * Module dependencies
 */
import User, { pack } from '../../../models/user';

/**
 * Show myself
 */
module.exports = (params, user, app) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

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
