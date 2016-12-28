'use strict';

/**
 * Module dependencies
 */
import User from '../../models/user';
import { validateUsername } from '../../models/user';

/**
 * Check available username
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = async (params) =>
	new Promise(async (res, rej) =>
{
	// Get 'username' parameter
	const username = params.username;
	if (username == null || username == '') {
		return rej('username-is-required');
	}

	// Validate username
	if (!validateUsername(username)) {
		return rej('invalid-username');
	}

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
