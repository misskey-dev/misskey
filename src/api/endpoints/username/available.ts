/**
 * Module dependencies
 */
import it from 'cafy';
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
	const [username, usernameError] = it(params.username).expect.string().required().trim().validate(validateUsername).get();
	if (usernameError) return rej('invalid username param');

	// Get exist
	const exist = await User
		.count({
			username_lower: username.toLowerCase()
		}, {
			limit: 1
		});

	// Reply
	res({
		available: exist === 0
	});
});
