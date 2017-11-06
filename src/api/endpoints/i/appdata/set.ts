/**
 * Module dependencies
 */
import $ from 'cafy';
import Appdata from '../../../models/appdata';
import User from '../../../models/user';
import serialize from '../../../serializers/user';
import event from '../../../event';

/**
 * Set app data
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @param {Boolean} isSecure
 * @return {Promise<any>}
 */
module.exports = (params, user, app, isSecure) => new Promise(async (res, rej) => {
	// Get 'data' parameter
	const [data, dataError] = $(params.data).optional.object()
		.pipe(obj => {
			const hasInvalidData = Object.entries(obj).some(([k, v]) =>
				$(k).string().match(/^[a-z_]+$/).nok() && $(v).string().nok());
			return !hasInvalidData;
		}).$;
	if (dataError) return rej('invalid data param');

	// Get 'key' parameter
	const [key, keyError] = $(params.key).optional.string().match(/[a-z_]+/).$;
	if (keyError) return rej('invalid key param');

	// Get 'value' parameter
	const [value, valueError] = $(params.value).optional.string().$;
	if (valueError) return rej('invalid value param');

	const set = {};
	if (data) {
		Object.entries(data).forEach(([k, v]) => {
			set[`data.${k}`] = v;
		});
	} else {
		set[`data.${key}`] = value;
	}

	if (isSecure) {
		const _user = await User.findOneAndUpdate(user._id, {
			$set: set
		});

		res(204);

		// Publish i updated event
		event(user._id, 'i_updated', await serialize(_user, user, {
			detail: true,
			includeSecrets: true
		}));
	} else {
		await Appdata.update({
			app_id: app._id,
			user_id: user._id
		}, Object.assign({
			app_id: app._id,
			user_id: user._id
		}, {
				$set: set
			}), {
				upsert: true
			});

		res(204);
	}
});
