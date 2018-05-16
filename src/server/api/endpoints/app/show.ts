/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import App, { pack } from '../../../../models/app';

/**
 * @swagger
 * /app/show:
 *   note:
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
 */
module.exports = (params, user, app) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	// Get 'appId' parameter
	const [appId, appIdErr] = $.type(ID).optional().get(params.appId);
	if (appIdErr) return rej('invalid appId param');

	// Get 'nameId' parameter
	const [nameId, nameIdErr] = $.str.optional().get(params.nameId);
	if (nameIdErr) return rej('invalid nameId param');

	if (appId === undefined && nameId === undefined) {
		return rej('appId or nameId is required');
	}

	// Lookup app
	const ap = appId !== undefined
		? await App.findOne({ _id: appId })
		: await App.findOne({ nameIdLower: nameId.toLowerCase() });

	if (ap === null) {
		return rej('app not found');
	}

	// Send response
	res(await pack(ap, user, {
		includeSecret: isSecure && ap.userId.equals(user._id)
	}));
});
