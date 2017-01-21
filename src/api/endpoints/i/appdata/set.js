'use strict';

/**
 * Module dependencies
 */
import Appdata from '../../../models/appdata';
import User from '../../../models/user';
import serialize from '../../../serializers/user';
import event from '../../../event';

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
		const _user = await User.findOneAndUpdate(user._id, {
			$set: {
				data: Object.assign(user.data || {}, JSON.parse(data))
			}
		});
		res(204);

		// Publish i updated event
		event(user._id, 'i_updated', await serialize(_user, user, {
			detail: true,
			includeSecrets: true
		}));
	} else {
		const appdata = await Appdata.findOne({
			app_id: app._id,
			user_id: user._id
		});
		await Appdata.update({
			app_id: app._id,
			user_id: user._id
		}, Object.assign({
			app_id: app._id,
			user_id: user._id
		}, {
			$set: {
				data: Object.assign((appdata || {}).data || {}, JSON.parse(data))
			}
		}), {
			upsert: true
		});
		res(204);
	}
});
