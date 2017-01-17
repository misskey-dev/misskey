'use strict';

/**
 * Module dependencies
 */
import Appdata from '../../../models/appdata';
import User from '../../../models/user';

/**
 * Set app data
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
	const data = params.data;
	if (data == null) {
		return rej('data is required');
	}

	if (isSecure) {
		const set = {
			$set: {
				data: Object.assign(user.data || {}, JSON.parse(data))
			}
		};
		await User.update({ _id: user._id }, set);
		res(204);
	} else {
		const appdata = await Appdata.findOne({
			app_id: app._id,
			user_id: user._id
		});
		const set = {
			$set: {
				data: Object.assign((appdata || {}).data || {}, JSON.parse(data))
			}
		};
		await Appdata.update({
			app_id: app._id,
			user_id: user._id
		}, Object.assign({
			app_id: app._id,
			user_id: user._id
		}, set), {
			upsert: true
		});
		res(204);
	}
});
