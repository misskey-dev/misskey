/**
 * Module dependencies
 */
import rndstr from 'rndstr';
import $ from 'cafy';
import App, { isValidNameId, pack } from '../../../../models/app';

/**
 * @swagger
 * /app/create:
 *   note:
 *     summary: Create an application
 *     parameters:
 *       - $ref: "#/parameters/AccessToken"
 *       -
 *         name: nameId
 *         description: Application unique name
 *         in: formData
 *         required: true
 *         type: string
 *       -
 *         name: name
 *         description: Application name
 *         in: formData
 *         required: true
 *         type: string
 *       -
 *         name: description
 *         description: Application description
 *         in: formData
 *         required: true
 *         type: string
 *       -
 *         name: permission
 *         description: Permissions that application has
 *         in: formData
 *         required: true
 *         type: array
 *         items:
 *           type: string
 *           collectionFormat: csv
 *       -
 *         name: callbackUrl
 *         description: URL called back after authentication
 *         in: formData
 *         required: false
 *         type: string
 *
 *     responses:
 *       200:
 *         description: Created application's information
 *         schema:
 *           $ref: "#/definitions/Application"
 *
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Create an app
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'nameId' parameter
	const [nameId, nameIdErr] = $.str.pipe(isValidNameId).get(params.nameId);
	if (nameIdErr) return rej('invalid nameId param');

	// Get 'name' parameter
	const [name, nameErr] = $.str.get(params.name);
	if (nameErr) return rej('invalid name param');

	// Get 'description' parameter
	const [description, descriptionErr] = $.str.get(params.description);
	if (descriptionErr) return rej('invalid description param');

	// Get 'permission' parameter
	const [permission, permissionErr] = $.arr($.str).unique().get(params.permission);
	if (permissionErr) return rej('invalid permission param');

	// Get 'callbackUrl' parameter
	// TODO: Check it is valid url
	const [callbackUrl = null, callbackUrlErr] = $.str.optional().nullable().get(params.callbackUrl);
	if (callbackUrlErr) return rej('invalid callbackUrl param');

	// Generate secret
	const secret = rndstr('a-zA-Z0-9', 32);

	// Create account
	const app = await App.insert({
		createdAt: new Date(),
		userId: user._id,
		name: name,
		nameId: nameId,
		nameIdLower: nameId.toLowerCase(),
		description: description,
		permission: permission,
		callbackUrl: callbackUrl,
		secret: secret
	});

	// Response
	res(await pack(app));
});
