'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import User from '../../models/user';
import serialize from '../../serializers/user';

/**
 * Show a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	const [userId, userIdErr] = it(params.user_id, 'id');
	if (userIdErr) return rej('invalid user_id param');

	// Get 'username' parameter
	const [username, usernameErr] = it(params.username, 'string');
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
	res(await serialize(user, me, {
		detail: true
	}));
});
