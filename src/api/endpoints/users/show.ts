/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack } from '../../models/user';

/**
 * Show a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'user_id' parameter
	const [userId, userIdErr] = $(params.user_id).optional.id().$;
	if (userIdErr) return rej('invalid user_id param');

	// Get 'username' parameter
	const [username, usernameErr] = $(params.username).optional.string().$;
	if (usernameErr) return rej('invalid username param');

	if (userId === undefined && username === undefined) {
		return rej('user_id or username is required');
	}

	const q = userId !== undefined
		? { _id: userId }
		: { username_lower: username.toLowerCase() };

	// Lookup user
	const user = await User.findOne(q, {
		fields: {
			data: false
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	// Send response
	res(await pack(user, me, {
		detail: true
	}));
});
