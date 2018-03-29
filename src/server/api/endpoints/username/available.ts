/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';
import { validateUsername } from '../../models/user';

/**
 * Check available username
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = async (params) => new Promise(async (res, rej) => {
	// Get 'username' parameter
	const [username, usernameError] = $(params.username).string().pipe(validateUsername).$;
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
