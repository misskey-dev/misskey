'use strict';

/**
 * Module dependencies
 */
import rndstr from 'rndstr';
const crypto = require('crypto');
import App from '../../models/app';
import AuthSess from '../../models/auth-session';
import AccessToken from '../../models/access-token';

/**
 * @swagger
 * /auth/accept:
 *   post:
 *     summary: Accept a session
 *     parameters:
 *       - $ref: "#/parameters/NativeToken"
 *       - 
 *         name: token
 *         description: Session Token
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       204:
 *         description: OK
 *       
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

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
	const sesstoken = params.token;
	if (sesstoken == null) {
		return rej('token is required');
	}

	// Fetch token
	const session = await AuthSess
		.findOne({ token: sesstoken });

	if (session === null) {
		return rej('session not found');
	}

	// Generate access token
	const token = rndstr('a-zA-Z0-9', 32);

	// Fetch exist access token
	const exist = await AccessToken.findOne({
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
		sha512.update(token + app.secret);
		const hash = sha512.digest('hex');

		// Insert access token doc
		await AccessToken.insert({
			created_at: new Date(),
			app_id: session.app_id,
			user_id: user._id,
			token: token,
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
