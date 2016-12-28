'use strict';

/**
 * Module dependencies
 */
import Appdata from '../../../models/appdata';

/**
 * Get app data
 *
 * @param {Object} params
 * @param {Object} user
 * @param {Object} app
 * @param {Boolean} isSecure
 * @return {Promise<object>}
 */
module.exports = (params, user, app, isSecure) =>
	new Promise(async (res, rej) =>
{
	// Get 'key' parameter
	let key = params.key;
	if (key === undefined) {
		key = null;
	}

	if (isSecure) {
		if (!user.data) {
			return res();
		}
		if (key !== null) {
			const data = {};
			data[key] = user.data[key];
			res(data);
		} else {
			res(user.data);
		}
	} else {
		const select = {};
		if (key !== null) {
			select['data.' + key] = true;
		}
		const appdata = await Appdata.findOne({
			app_id: app._id,
			user_id: user._id
		}, select);

		if (appdata) {
			res(appdata.data);
		} else {
			res();
		}
	}
});
