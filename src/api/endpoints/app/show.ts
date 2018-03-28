/**
 * Module dependencies
 */
import $ from 'cafy';
import App, { pack } from '../../models/app';

/**
 * @swagger
 * /app/show:
 *   post:
 *     summary: Show an application's information
 *     description: Require appId or nameId
 *     parameters:
 *       -
 *         name: appId
 *         description: Application ID
 *         in: formData
 *         type: string
 *       -
 *         name: nameId
 *         description: Application unique name
 *         in: formData
 *         type: string
 *
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           $ref: "#/definitions/Application"
 *
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Show an app
 *
 * @param {any} params
 * @param {any} user
 * @param {any} _
 * @param {any} isSecure
 * @return {Promise<any>}
 */
module.exports = (params, user, _, isSecure) => new Promise(async (res, rej) => {
	// Get 'appId' parameter
	const [appId, appIdErr] = $(params.appId).optional.id().$;
	if (appIdErr) return rej('invalid appId param');

	// Get 'nameId' parameter
	const [nameId, nameIdErr] = $(params.nameId).optional.string().$;
	if (nameIdErr) return rej('invalid nameId param');

	if (appId === undefined && nameId === undefined) {
		return rej('appId or nameId is required');
	}

	// Lookup app
	const app = appId !== undefined
		? await App.findOne({ _id: appId })
		: await App.findOne({ nameIdLower: nameId.toLowerCase() });

	if (app === null) {
		return rej('app not found');
	}

	// Send response
	res(await pack(app, user, {
		includeSecret: isSecure && app.userId.equals(user._id)
	}));
});
