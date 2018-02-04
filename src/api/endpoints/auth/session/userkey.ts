/**
 * Module dependencies
 */
import $ from 'cafy';
import App from '../../../models/app';
import AuthSess from '../../../models/auth-session';
import AccessToken from '../../../models/access-token';
import { pack } from '../../../models/user';

/**
 * @swagger
 * /auth/session/userkey:
 *   post:
 *     summary: Get an access token(userkey)
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
 *               description: Access Token
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
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'app_secret' parameter
	const [appSecret, appSecretErr] = $(params.app_secret).string().$;
	if (appSecretErr) return rej('invalid app_secret param');

	// Lookup app
	const app = await App.findOne({
		secret: appSecret
	});

	if (app == null) {
		return rej('app not found');
	}

	// Get 'token' parameter
	const [token, tokenErr] = $(params.token).string().$;
	if (tokenErr) return rej('invalid token param');

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

	// Lookup access token
	const accessToken = await AccessToken.findOne({
		app_id: app._id,
		user_id: session.user_id
	});

	// Delete session

	/* https://github.com/Automattic/monk/issues/178
	AuthSess.deleteOne({
		_id: session._id
	});
	*/
	AuthSess.remove({
		_id: session._id
	});

	// Response
	res({
		access_token: accessToken.token,
		user: await pack(session.user_id, null, {
			detail: true
		})
	});
});
