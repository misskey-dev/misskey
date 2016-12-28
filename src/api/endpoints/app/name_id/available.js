'use strict';

/**
 * Module dependencies
 */
import App from '../../../models/app';

/**
 * Check available name_id of app
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = async (params) =>
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

	// Get exist
	const exist = await App
		.count({
			name_id_lower: nameId.toLowerCase()
		}, {
			limit: 1
		});

	// Reply
	res({
		available: exist === 0
	});
});
