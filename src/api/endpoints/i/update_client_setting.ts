/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack } from '../../models/user';
import event from '../../event';

/**
 * Update myself
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = $(params.name).string().$;
	if (nameErr) return rej('invalid name param');

	// Get 'value' parameter
	const [value, valueErr] = $(params.value).nullable.any().$;
	if (valueErr) return rej('invalid value param');

	const x = {};
	x[`account.client_settings.${name}`] = value;

	await User.update(user._id, {
		$set: x
	});

	// Serialize
	user.account.client_settings[name] = value;
	const iObj = await pack(user, user, {
		detail: true,
		includeSecrets: true
	});

	// Send response
	res(iObj);

	// Publish i updated event
	event(user._id, 'i_updated', iObj);
});
