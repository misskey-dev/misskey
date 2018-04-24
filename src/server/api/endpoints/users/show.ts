/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import User, { pack } from '../../../../models/user';
import resolveRemoteUser from '../../../../remote/resolve-user';

const cursorOption = { fields: { data: false } };

/**
 * Show a user
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	let user;

	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).optional.type(ID).$;
	if (userIdErr) return rej('invalid userId param');

	// Get 'username' parameter
	const [username, usernameErr] = $(params.username).optional.string().$;
	if (usernameErr) return rej('invalid username param');

	// Get 'host' parameter
	const [host, hostErr] = $(params.host).nullable.optional.string().$;
	if (hostErr) return rej('invalid host param');

	if (userId === undefined && typeof username !== 'string') {
		return rej('userId or pair of username and host is required');
	}

	// Lookup user
	if (typeof host === 'string') {
		try {
			user = await resolveRemoteUser(username, host, cursorOption);
		} catch (e) {
			console.warn(`failed to resolve remote user: ${e}`);
			return rej('failed to resolve remote user');
		}
	} else {
		const q = userId !== undefined
			? { _id: userId }
			: { usernameLower: username.toLowerCase(), host: null };

		user = await User.findOne(q, cursorOption);

		if (user === null) {
			return rej('user not found');
		}
	}

	// Send response
	res(await pack(user, me, {
		detail: true
	}));
});
