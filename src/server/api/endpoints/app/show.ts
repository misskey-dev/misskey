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
 *     description: Require app_id or name_id
 *     parameters:
 *       -
 *         name: app_id
 *         description: Application ID
 *         in: formData
 *         type: string
 *       -
 *         name: name_id
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
	// Get 'app_id' parameter
	const [appId, appIdErr] = $(params.app_id).optional.id().$;
	if (appIdErr) return rej('invalid app_id param');

	// Get 'name_id' parameter
	const [nameId, nameIdErr] = $(params.name_id).optional.string().$;
	if (nameIdErr) return rej('invalid name_id param');

	if (appId === undefined && nameId === undefined) {
		return rej('app_id or name_id is required');
	}

	// Lookup app
	const app = appId !== undefined
		? await App.findOne({ _id: appId })
		: await App.findOne({ name_id_lower: nameId.toLowerCase() });

	if (app === null) {
		return rej('app not found');
	}

	// Send response
	res(await pack(app, user, {
		includeSecret: isSecure && app.user_id.equals(user._id)
	}));
});
