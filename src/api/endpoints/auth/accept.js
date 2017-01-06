'use strict';

/**
 * Module dependencies
 */
import rndstr from 'rndstr';
const crypto = require('crypto');
import App from '../../models/app';
import AuthSess from '../../models/auth-session';
import Userkey from '../../models/userkey';

/**
 * Accept
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'token' parameter
	const token = params.token;
	if (token == null) {
		return rej('token is required');
	}

	// Fetch token
	const session = await AuthSess
		.findOne({ token: token });

	if (session === null) {
		return rej('session not found');
	}

	// Generate userkey
	const key = rndstr('a-zA-Z0-9', 32);

	// Fetch exist userkey
	const exist = await Userkey.findOne({
		app_id: session.app_id,
		user_id: user._id,
	});

	if (exist === null) {
		// Lookup app
		const app = await App.findOne({
			app_id: session.app_id
		});

		// Generate Hash
		const sha512 = crypto.createHash('sha512');
		sha512.update(key + app.secret);
		const hash = sha512.digest('hex');

		// Insert userkey doc
		await Userkey.insert({
			created_at: new Date(),
			app_id: session.app_id,
			user_id: user._id,
			key: key,
			hash: hash
		});
	}

	// Update session
	await AuthSess.updateOne({
		_id: session._id
	}, {
		$set: {
			user_id: user._id
		}
	});

	// Response
	res();
});
