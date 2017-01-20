'use strict';

/**
 * Module dependencies
 */
import rndstr from 'rndstr';
import App from '../../models/app';
import serialize from '../../serializers/app';

/**
 * @swagger
 * /app/create:
 *   post:
 *     summary: Create an application
 *     parameters:
 *       - $ref: "#/parameters/AccessToken"
 *       -
 *         name: name_id
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
 *         name: callback_url
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
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = async (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'name_id' parameter
	const nameId = params.name_id;
	if (nameId == null || nameId == '') {
		return rej('name_id is required');
	}

	// Validate name_id
	if (!/^[a-zA-Z0-9\-]{3,30}$/.test(nameId)) {
		return rej('invalid name_id');
	}

	// Get 'name' parameter
	const name = params.name;
	if (name == null || name == '') {
		return rej('name is required');
	}

	// Get 'description' parameter
	const description = params.description;
	if (description == null || description == '') {
		return rej('description is required');
	}

	// Get 'permission' parameter
	const permission = params.permission;
	if (permission == null || permission == '') {
		return rej('permission is required');
	}

	// Get 'callback_url' parameter
	let callback = params.callback_url;
	if (callback === '') {
		callback = null;
	}

	// Generate secret
	const secret = rndstr('a-zA-Z0-9', 32);

	// Create account
	const app = await App.insert({
		created_at: new Date(),
		user_id: user._id,
		name: name,
		name_id: nameId,
		name_id_lower: nameId.toLowerCase(),
		description: description,
		permission: permission.split(','),
		callback_url: callback,
		secret: secret
	});

	// Response
	res(await serialize(app));
});
