/**
 * Module dependencies
 */
import User, { pack } from '../models/user';

/**
 * Show myself
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @param {Boolean} isSecure
 * @return {Promise<any>}
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
			'account.lastUsedAt': new Date()
		}
	});
});
