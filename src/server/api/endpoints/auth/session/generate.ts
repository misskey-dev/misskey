/**
 * Module dependencies
 */
import * as uuid from 'uuid';
import $ from 'cafy';
import App from '../../../models/app';
import AuthSess from '../../../models/auth-session';
import config from '../../../../../conf';

/**
 * @swagger
 * /auth/session/generate:
 *   post:
 *     summary: Generate a session
 *     parameters:
 *       -
 *         name: appSecret
 *         description: App Secret
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
 *             token:
 *               type: string
 *               description: Session Token
 *             url:
 *               type: string
 *               description: Authentication form's URL
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
	// Get 'appSecret' parameter
	const [appSecret, appSecretErr] = $(params.appSecret).string().$;
	if (appSecretErr) return rej('invalid appSecret param');

	// Lookup app
	const app = await App.findOne({
		secret: appSecret
	});

	if (app == null) {
		return rej('app not found');
	}

	// Generate token
	const token = uuid.v4();

	// Create session token document
	const doc = await AuthSess.insert({
		createdAt: new Date(),
		appId: app._id,
		token: token
	});

	// Response
	res({
		token: doc.token,
		url: `${config.auth_url}/${doc.token}`
	});
});
