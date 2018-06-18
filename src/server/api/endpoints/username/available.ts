import $ from 'cafy';
import User from '../../../../models/user';
import { validateUsername } from '../../../../models/user';

/**
 * Check available username
 */
module.exports = async (params: any) => new Promise(async (res, rej) => {
	// Get 'username' parameter
	const [username, usernameError] = $.str.pipe(validateUsername).get(params.username);
	if (usernameError) return rej('invalid username param');

	// Get exist
	const exist = await User
		.count({
			host: null,
			usernameLower: username.toLowerCase()
		}, {
			limit: 1
		});

	// Reply
	res({
		available: exist === 0
	});
});
