'use strict';

/**
 * Module dependencies
 */
import rndstr from 'rndstr';
import App from '../../models/app';
import serialize from '../../serializers/app';

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
	const inserted = await App.insert({
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

	const app = inserted.ops[0];

	// Response
	res(await serialize(app));
});
