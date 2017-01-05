'use strict';

/**
 * Module dependencies
 */
import App from '../../../models/app';
import AuthSess from '../../../models/auth-session';
import Userkey from '../../../models/userkey';
import serialize from '../../../serializers/user';

/**
 * @swagger
 * /auth/session/userkey:
 *   post:
 *     summary: Get a userkey
 *     parameters:
 *       -
 *         name: app_secret
 *         description: App Secret
 *         in: formData
 *         required: true
 *         type: string
 *       -
 *         name: token
 *         description: Session Token
 *         in: formData
 *         required: true
 *         type: string
 *     
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             userkey:
 *               type: string
 *               description: User Key
 *             user:
 *               $ref: "#/definitions/User"
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Generate a session
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) =>
{
	// Get 'app_secret' parameter
	const appSecret = params.app_secret;
	if (appSecret == null) {
		return rej('app_secret is required');
	}

	// Lookup app
	const app = await App.findOne({
		secret: appSecret
	});

	if (app == null) {
		return rej('app not found');
	}

	// Get 'token' parameter
	const token = params.token;
	if (token == null) {
		return rej('token is required');
	}

	// Fetch token
	const session = await AuthSess
		.findOne({
			token: token,
			app_id: app._id
		});

	if (session === null) {
		return rej('session not found');
	}

	if (session.user_id == null) {
		return rej('this session is not allowed yet');
	}

	// Lookup userkey
	const userkey = await Userkey.findOne({
		app_id: app._id,
		user_id: session.user_id
	});

	// Delete session
	AuthSess.deleteOne({
		_id: session._id
	});

	// Response
	res({
		userkey: userkey.key,
		user: await serialize(session.user_id, null, {
			detail: true
		})
	});
});
